        </section>
    </div>
</div>

<script>
(function () {
    var hamburger = document.getElementById('hamburger');
    var sidebar   = document.getElementById('sidebar');
    var overlay   = document.getElementById('sidebarOverlay');
    if (hamburger && sidebar && overlay) {
        hamburger.addEventListener('click', function () {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });
        overlay.addEventListener('click', function () {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }

    var userToggle   = document.getElementById('userToggle');
    var userDropdown = document.getElementById('userDropdown');
    if (userToggle && userDropdown) {
        userToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            userDropdown.classList.toggle('open');
        });
        document.addEventListener('click', function (e) {
            if (!userDropdown.contains(e.target) && e.target !== userToggle) {
                userDropdown.classList.remove('open');
            }
        });
    }
})();
</script>
</body>
</html>
