/*
 * Vigicom - Firmware ESP8266
 * Conexion WiFi + panel de configuracion HTML.
 *
 * Modo AP de configuracion: si no hay credenciales guardadas o no logra
 * conectarse a la red, levanta un AP "Vigicom-Setup" (sin clave) en 192.168.4.1.
 * Modo STA: una vez conectado, sigue sirviendo el panel en la IP asignada.
 */

#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <DNSServer.h>
#include <EEPROM.h>

// -------- Configuracion persistente en EEPROM --------
struct Config {
  uint32_t magic;        // marcador de validez
  char     ssid[33];
  char     password[65];
  char     serverUrl[97];
  char     deviceId[33];
};

static const uint32_t CONFIG_MAGIC = 0x56494731; // "VIG1"
static const int      EEPROM_SIZE  = sizeof(Config);

Config cfg;

// -------- Servicios --------
ESP8266WebServer server(80);
DNSServer        dnsServer;
const byte       DNS_PORT = 53;
const char*      AP_SSID  = "Vigicom-Setup";

bool apMode = false;

// -------- Utilidades EEPROM --------
void loadConfig() {
  EEPROM.begin(EEPROM_SIZE);
  EEPROM.get(0, cfg);
  EEPROM.end();
  if (cfg.magic != CONFIG_MAGIC) {
    memset(&cfg, 0, sizeof(cfg));
    cfg.magic = CONFIG_MAGIC;
  }
}

void saveConfig() {
  EEPROM.begin(EEPROM_SIZE);
  EEPROM.put(0, cfg);
  EEPROM.commit();
  EEPROM.end();
}

// -------- HTML --------
String htmlEscape(const String& s) {
  String out;
  out.reserve(s.length());
  for (size_t i = 0; i < s.length(); i++) {
    char c = s[i];
    switch (c) {
      case '&': out += "&amp;"; break;
      case '<': out += "&lt;";  break;
      case '>': out += "&gt;";  break;
      case '"': out += "&quot;"; break;
      case '\'': out += "&#39;"; break;
      default: out += c;
    }
  }
  return out;
}

String renderPage(const String& msg) {
  String estado;
  if (apMode) {
    estado = "Modo configuracion (AP). SSID: " + String(AP_SSID);
  } else {
    estado = "Conectado a " + String(cfg.ssid) + " - IP: " + WiFi.localIP().toString();
  }

  String page;
  page.reserve(2048);
  page += F("<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\">");
  page += F("<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">");
  page += F("<title>Vigicom - Configuracion</title><style>");
  page += F("body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:24px}");
  page += F(".card{max-width:480px;margin:0 auto;background:#1e293b;border-radius:12px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,.4)}");
  page += F("h1{margin:0 0 8px;font-size:1.4rem}h2{font-size:1rem;color:#94a3b8;margin:0 0 20px;font-weight:500}");
  page += F("label{display:block;margin:14px 0 4px;font-size:.9rem;color:#cbd5e1}");
  page += F("input{width:100%;padding:10px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#e2e8f0;font-size:1rem;box-sizing:border-box}");
  page += F("button{margin-top:20px;width:100%;padding:12px;border:0;border-radius:8px;background:#2563eb;color:#fff;font-size:1rem;font-weight:600;cursor:pointer}");
  page += F("button:hover{background:#1d4ed8}.msg{margin:12px 0;padding:10px;border-radius:8px;background:#065f46;color:#d1fae5;font-size:.9rem}");
  page += F(".estado{margin:0 0 16px;padding:10px;border-radius:8px;background:#0f172a;border:1px solid #334155;font-size:.85rem;color:#94a3b8}");
  page += F(".row{display:flex;gap:8px;margin-top:12px}.row button{flex:1;margin:0}");
  page += F(".secundario{background:#475569}.secundario:hover{background:#334155}");
  page += F("</style></head><body><div class=\"card\">");
  page += F("<h1>Vigicom</h1><h2>Panel de configuracion del dispositivo</h2>");
  page += F("<div class=\"estado\">"); page += htmlEscape(estado); page += F("</div>");

  if (msg.length()) {
    page += F("<div class=\"msg\">"); page += htmlEscape(msg); page += F("</div>");
  }

  page += F("<form method=\"POST\" action=\"/guardar\">");
  page += F("<label>SSID WiFi</label><input name=\"ssid\" maxlength=\"32\" required value=\"");
  page += htmlEscape(cfg.ssid); page += F("\">");
  page += F("<label>Contrasena WiFi</label><input name=\"password\" type=\"password\" maxlength=\"64\" value=\"");
  page += htmlEscape(cfg.password); page += F("\">");
  page += F("<label>URL del servidor</label><input name=\"serverUrl\" maxlength=\"96\" placeholder=\"https://cloud.vigicom.net.ar\" value=\"");
  page += htmlEscape(cfg.serverUrl); page += F("\">");
  page += F("<label>ID del dispositivo</label><input name=\"deviceId\" maxlength=\"32\" value=\"");
  page += htmlEscape(cfg.deviceId); page += F("\">");
  page += F("<button type=\"submit\">Guardar y reiniciar</button></form>");
  page += F("<form method=\"POST\" action=\"/reset\" onsubmit=\"return confirm('Borrar configuracion?')\">");
  page += F("<div class=\"row\"><button type=\"submit\" class=\"secundario\">Restablecer</button></div></form>");
  page += F("</div></body></html>");
  return page;
}

// -------- Handlers HTTP --------
void handleRoot() {
  server.send(200, "text/html; charset=utf-8", renderPage(""));
}

void handleSave() {
  String ssid     = server.arg("ssid");
  String pass     = server.arg("password");
  String url      = server.arg("serverUrl");
  String devId    = server.arg("deviceId");

  if (ssid.length() == 0 || ssid.length() > 32) {
    server.send(400, "text/html; charset=utf-8", renderPage("SSID invalido."));
    return;
  }

  strlcpy(cfg.ssid,      ssid.c_str(),  sizeof(cfg.ssid));
  strlcpy(cfg.password,  pass.c_str(),  sizeof(cfg.password));
  strlcpy(cfg.serverUrl, url.c_str(),   sizeof(cfg.serverUrl));
  strlcpy(cfg.deviceId,  devId.c_str(), sizeof(cfg.deviceId));
  saveConfig();

  server.send(200, "text/html; charset=utf-8",
    F("<!doctype html><meta charset=\"utf-8\"><body style=\"font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:24px\">"
      "<h2>Configuracion guardada</h2><p>El dispositivo se reiniciara en 3 segundos.</p></body>"));
  delay(3000);
  ESP.restart();
}

void handleReset() {
  memset(&cfg, 0, sizeof(cfg));
  cfg.magic = CONFIG_MAGIC;
  saveConfig();
  server.send(200, "text/html; charset=utf-8",
    F("<!doctype html><meta charset=\"utf-8\"><body style=\"font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:24px\">"
      "<h2>Configuracion borrada</h2><p>Reiniciando...</p></body>"));
  delay(2000);
  ESP.restart();
}

void handleNotFound() {
  // Captive portal: redirige todo al panel cuando estamos en modo AP.
  if (apMode) {
    server.sendHeader("Location", String("http://") + WiFi.softAPIP().toString(), true);
    server.send(302, "text/plain", "");
    return;
  }
  server.send(404, "text/plain", "No encontrado");
}

// -------- Conexion WiFi --------
bool conectarSTA() {
  if (strlen(cfg.ssid) == 0) return false;

  WiFi.mode(WIFI_STA);
  WiFi.begin(cfg.ssid, cfg.password);
  Serial.printf("Conectando a %s", cfg.ssid);

  uint32_t inicio = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - inicio < 20000) {
    delay(500);
    Serial.print('.');
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Conectado. IP: ");
    Serial.println(WiFi.localIP());
    return true;
  }
  Serial.println("Fallo conexion WiFi.");
  return false;
}

void iniciarAP() {
  apMode = true;
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID);
  Serial.print("AP de configuracion: ");
  Serial.println(WiFi.softAPIP());
  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());
}

// -------- Setup / Loop --------
void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\nVigicom firmware iniciando...");

  loadConfig();

  if (!conectarSTA()) {
    iniciarAP();
  }

  server.on("/",        HTTP_GET,  handleRoot);
  server.on("/guardar", HTTP_POST, handleSave);
  server.on("/reset",   HTTP_POST, handleReset);
  server.onNotFound(handleNotFound);
  server.begin();
  Serial.println("HTTP server listo.");
}

void loop() {
  if (apMode) dnsServer.processNextRequest();
  server.handleClient();
}
