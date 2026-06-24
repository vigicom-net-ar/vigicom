"""Motor de Vigicom.

Escucha mensajes MQTT del tranceptor + equipos, registra las señales entrantes
en MySQL y dispara los endpoints de procesamiento del API en intervalos fijos.

Refactor moderno (Python 3.12) del antiguo paquete `motor/` (framework.py,
framework_mqtt.py, subframework.py, inicio.py) que estaba en Python 2.
"""

from __future__ import annotations

import logging
import os
import signal
import sys
import threading
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Callable

import paho.mqtt.client as mqtt
import pymysql
import requests


logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("motor")


# ---------------------------------------------------------------- config ---

def _require_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or value == "":
        raise RuntimeError(f"Falta variable de entorno: {name}")
    return value


@dataclass(frozen=True)
class Config:
    identidad: str
    tranceptor: str
    separador: str

    mqtt_host: str
    mqtt_port: int
    mqtt_user: str
    mqtt_pass: str
    mqtt_topics: tuple[str, ...]

    db_host: str
    db_port: int
    db_user: str
    db_pass: str
    db_name: str

    api_url: str
    api_timeout_s: float

    @classmethod
    def from_env(cls) -> "Config":
        topics_raw = os.getenv("MOTOR_TOPICS", "IN/#,UP/#")
        topics = tuple(t.strip() for t in topics_raw.split(",") if t.strip())
        return cls(
            identidad=os.getenv("MOTOR_IDENTIDAD", "M3728194565"),
            tranceptor=os.getenv("MOTOR_TRANCEPTOR", "T7319426850"),
            separador=os.getenv("MOTOR_SEPARADOR", "~"),
            mqtt_host=_require_env("MQTT_HOST"),
            mqtt_port=int(os.getenv("MQTT_PORT", "1883")),
            mqtt_user=_require_env("MQTT_USER"),
            mqtt_pass=_require_env("MQTT_PASS"),
            mqtt_topics=topics,
            db_host=_require_env("DB_HOST"),
            db_port=int(os.getenv("DB_PORT", "3306")),
            db_user=_require_env("DB_USER"),
            db_pass=_require_env("DB_PASS"),
            db_name=_require_env("DB_NAME"),
            api_url=os.getenv(
                "MOTOR_API_URL",
                "https://api.vigicom.net.ar/motor/proceso",
            ),
            api_timeout_s=float(os.getenv("MOTOR_API_TIMEOUT", "30")),
        )


# -------------------------------------------------------------- database ---

class Database:
    """Conexión MySQL ligera. Una conexión por operación: simple y robusto frente a cortes."""

    def __init__(self, cfg: Config) -> None:
        self._cfg = cfg

    def _connect(self) -> pymysql.connections.Connection:
        return pymysql.connect(
            host=self._cfg.db_host,
            port=self._cfg.db_port,
            user=self._cfg.db_user,
            password=self._cfg.db_pass,
            database=self._cfg.db_name,
            charset="utf8mb4",
            autocommit=False,
            cursorclass=pymysql.cursors.DictCursor,
        )

    def execute(self, sql: str, params: tuple = ()) -> None:
        try:
            with self._connect() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, params)
                conn.commit()
        except Exception:
            log.exception("MySQL error ejecutando: %s", sql)


# --------------------------------------------------------------- señales ---

class Senales:
    TABLE = "senales"
    GENESIS = "1500-01-01 00:00:00"

    _PRIORIDAD_ALTA = {"ALARMA", "ALERTA", "AYUDA"}
    _PRIORIDAD_MEDIA = {
        "LUZ", "LUCES", "SIRENA", "SIRENAS", "ENCENDER", "APAGAR",
    }

    def __init__(self, db: Database) -> None:
        self._db = db

    def registrar(self, sentido: str, propagacion: str, texto: str) -> None:
        prioridad = self._prioridad(texto)
        sql = (
            f"insert into {self.TABLE} "
            "(fecha, sentido, propagacion, texto, prioridad, intentos, procesada, estado) "
            "values (%s, %s, %s, %s, %s, 0, %s, 0)"
        )
        self._db.execute(
            sql,
            (
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                sentido,
                propagacion,
                texto,
                str(prioridad),
                self.GENESIS,
            ),
        )

    @classmethod
    def _prioridad(cls, texto: str) -> int:
        clave = texto.strip().upper()
        if clave in cls._PRIORIDAD_ALTA:
            return 5
        if clave in cls._PRIORIDAD_MEDIA:
            return 4
        return 1


# ------------------------------------------------------------------ mqtt ---

OnMessage = Callable[[str, str], None]


class MqttBroker:
    def __init__(self, cfg: Config, on_message: OnMessage) -> None:
        self._cfg = cfg
        self._on_message = on_message

        self._client = mqtt.Client(
            mqtt.CallbackAPIVersion.VERSION2,
            client_id=cfg.identidad,
            clean_session=True,
        )
        self._client.username_pw_set(cfg.mqtt_user, cfg.mqtt_pass)
        self._client.reconnect_delay_set(min_delay=1, max_delay=30)
        self._client.on_connect = self._on_connect
        self._client.on_disconnect = self._on_disconnect
        self._client.on_message = self._on_message_raw

    def start(self) -> None:
        log.info("MQTT conectando a %s:%s", self._cfg.mqtt_host, self._cfg.mqtt_port)
        self._client.connect_async(
            self._cfg.mqtt_host, self._cfg.mqtt_port, keepalive=60
        )
        self._client.loop_start()

    def stop(self) -> None:
        try:
            self._client.disconnect()
        finally:
            self._client.loop_stop()

    def publish(self, topic: str, payload: str) -> None:
        try:
            log.info("MQTT publicado | %s | %s", topic, payload)
            self._client.publish(topic, payload, qos=2)
        except Exception:
            log.exception("MQTT error publicando %s", topic)

    def _on_connect(self, client, _userdata, _flags, reason_code, _props=None) -> None:
        log.info("MQTT conectado (rc=%s)", reason_code)
        for topic in self._cfg.mqtt_topics:
            log.info("MQTT suscripto | %s", topic)
            client.subscribe(topic)

    def _on_disconnect(self, _client, _userdata, *args) -> None:
        rc = args[-1] if args else "?"
        log.warning("MQTT desconectado (rc=%s)", rc)

    def _on_message_raw(self, _client, _userdata, msg) -> None:
        try:
            payload = msg.payload.decode("utf-8", errors="replace")
        except Exception:
            payload = repr(msg.payload)
        try:
            self._on_message(msg.topic, payload)
        except Exception:
            log.exception("Error procesando mensaje MQTT (%s)", msg.topic)


# ------------------------------------------------------------------- api ---

class ApiClient:
    def __init__(self, base_url: str, timeout_s: float) -> None:
        self._base = base_url.rstrip("/")
        self._timeout = timeout_s
        self._session = requests.Session()

    def call(self, path: str, etiqueta: str = "") -> None:
        url = f"{self._base}{path}"
        try:
            resp = self._session.get(url, timeout=self._timeout)
        except Exception as e:
            log.error("ERROR motor (%s) | %s", path, e)
            return

        html = (resp.text or "").strip()
        if not html:
            return
        html = (
            html.replace("<br />", "\n")
                .replace("<br/>", "\n")
                .replace("<br>", "\n")
        )
        prefix = f"[{etiqueta}] " if etiqueta else ""
        log.info("%s%s", prefix, html)


# ------------------------------------------------------------ scheduler ---

@dataclass
class TareaPeriodica:
    nombre: str
    intervalo_s: float
    accion: Callable[[], None]
    proxima: float = 0.0

    def vencida(self, ahora: float) -> bool:
        return ahora >= self.proxima

    def reprogramar(self, ahora: float) -> None:
        self.proxima = ahora + self.intervalo_s


# ----------------------------------------------------------------- motor ---

class Motor:
    """Orquesta MQTT, base de datos y ciclos periódicos contra el API."""

    def __init__(self, cfg: Config) -> None:
        self._cfg = cfg
        self._db = Database(cfg)
        self._senales = Senales(self._db)
        self._api = ApiClient(cfg.api_url, cfg.api_timeout_s)
        self._mqtt = MqttBroker(cfg, self._on_mqtt_message)
        self._stop = threading.Event()
        self._tareas = self._build_tareas()

    def _build_tareas(self) -> list[TareaPeriodica]:
        api = self._api
        return [
            TareaPeriodica("senalesProcesar", 0.5, lambda: api.call("/senalesProcesar")),
            TareaPeriodica("disparosProcesar", 1.0, lambda: api.call("/disparosProcesar")),
            TareaPeriodica("comandosProcesar", 2.0, lambda: api.call("/comandosProcesar", "Procesamiento")),
            TareaPeriodica("senalesEnviar", 2.0, lambda: api.call("/senalesEnviar", "Envios")),
            TareaPeriodica("disparosAbiertos", 10.0, lambda: api.call("/disparosAbiertos")),
            TareaPeriodica("disparosReportar", 10.0, lambda: api.call("/disparosReportar")),
            TareaPeriodica("motoresVerificar", 300.0, lambda: api.call("/motoresVerificar")),
        ]

    def run(self) -> None:
        signal.signal(signal.SIGTERM, self._on_signal)
        signal.signal(signal.SIGINT, self._on_signal)

        log.info("VIGICOM MOTOR iniciando (identidad=%s)", self._cfg.identidad)
        self._mqtt.start()
        try:
            self._loop()
        finally:
            log.info("VIGICOM MOTOR detenido")
            self._mqtt.stop()

    def _loop(self) -> None:
        while not self._stop.is_set():
            ahora = time.monotonic()
            for tarea in self._tareas:
                if not tarea.vencida(ahora):
                    continue
                try:
                    tarea.accion()
                except Exception:
                    log.exception("Error ejecutando tarea %s", tarea.nombre)
                tarea.reprogramar(time.monotonic())
            self._stop.wait(0.1)

    def _on_signal(self, signum, _frame) -> None:
        log.info("Señal recibida (%s), deteniendo...", signum)
        self._stop.set()

    # ---- MQTT message handler --------------------------------------------

    def _on_mqtt_message(self, topic: str, mensaje: str) -> None:
        # Sólo escucha protocolo Vigicom (IN/) y protocolo Vigia (UP/).
        if not (topic.startswith("IN/") or topic.startswith("UP/")):
            return

        identidad = topic.split("/", 1)[1]
        sep = self._cfg.separador

        if identidad == self._cfg.tranceptor:
            self._handle_tranceptor(topic, mensaje, sep)
        else:
            self._senales.registrar("E", identidad, mensaje)

    def _handle_tranceptor(self, topic: str, mensaje: str, sep: str) -> None:
        partes = mensaje.split(sep)
        comando = partes[0] if partes else ""

        # Anti spam: el latido (RTR) no se imprime.
        if comando != "RTR":
            log.info("MQTT recibido | %s | %s", topic, mensaje)

        if comando == "MTR" and len(partes) >= 4:
            # MTR ~ [comunicador] ~ [canal] ~ [telefono] ~ [mensaje]
            telefono = partes[2][-10:]
            texto = partes[3]
            self._senales.registrar("E", telefono, texto)

        elif comando == "LTR" and len(partes) >= 3:
            # LTR ~ [comunicador] ~ [canal] ~ [telefono]
            telefono = partes[2][-10:]
            self._senales.registrar("E", telefono, "ALARMA")

        elif comando == "RTR" and len(partes) >= 2:
            # RTR ~ [nombre]  → pulsación del comunicador
            nombre = partes[1]
            self._api.call(f"/pulsacion?cmd=rtr&nom={nombre}")
            log.debug("MQTT latido | %s | %s", topic, mensaje)


# ------------------------------------------------------------------ main ---

def main() -> None:
    cfg = Config.from_env()
    Motor(cfg).run()


if __name__ == "__main__":
    main()
