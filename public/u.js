(function () {
  var IG_SVG = '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.3" fill="currentColor"/></svg>';
  var WA_SVG = '<svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.83 14.12c-.25.7-1.45 1.33-2.02 1.42-.52.08-1.17.11-1.89-.12-.44-.14-1-.33-1.72-.62-3-1.29-4.95-4.31-5.1-4.51-.15-.2-1.22-1.62-1.22-3.09 0-1.47.77-2.19 1.05-2.49.27-.3.6-.37.8-.37h.57c.18 0 .43-.07.67.51.25.6.85 2.07.92 2.22.07.15.12.33.02.53-.1.2-.15.33-.3.51-.15.18-.32.4-.45.53-.15.15-.31.31-.13.61.18.3.79 1.31 1.7 2.12 1.17 1.04 2.15 1.36 2.46 1.51.31.15.49.13.67-.08.18-.2.77-.9.97-1.21.2-.31.41-.26.68-.15.28.1 1.75.82 2.05.97.3.15.5.23.58.35.07.13.07.73-.18 1.43z"/></svg>';

  var card = document.getElementById('card');
  var errBox = document.getElementById('err');
  var errMsg = errBox.querySelector('.msg');

  var id = new URLSearchParams(location.search).get('id');
  if (!id) return showErr('Enlace inválido');

  fetch('/api/qr-profile?id=' + encodeURIComponent(id))
    .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, json: j }; }); })
    .then(function (res) {
      if (!res.ok || res.json.error) return showErr('No encontramos ese perfil');
      var d = res.json;
      if (!d.instagram && !d.whatsapp) return showErr('Esta persona aún no configuró su QR');
      render(d);
    })
    .catch(function () { showErr('Error de conexión'); });

  function render(d) {
    document.title = (d.nombre || 'Contacto') + ' · Contacto';
    var av = document.getElementById('avatar');
    if (d.avatar_url) {
      av.innerHTML = '<img src="' + d.avatar_url + '" alt="Foto" />';
    } else {
      av.style.background = 'rgba(79,195,247,0.15)';
      av.style.color = '#4FC3F7';
      av.style.display = 'flex';
      av.style.alignItems = 'center';
      av.style.justifyContent = 'center';
      av.style.fontSize = '28px';
      av.style.fontWeight = '600';
      av.textContent = (d.nombre || '?').slice(0, 2).toUpperCase();
    }
    document.getElementById('nombre').textContent = d.nombre || 'Instructor';
    document.getElementById('sub').textContent = d.sub || 'Profesor de Ski';
    var html = '';
    if (d.instagram) {
      html += '<a class="btn btn-ig" href="https://instagram.com/' + encodeURIComponent(d.instagram) + '" target="_blank" rel="noopener">' + IG_SVG + 'Instagram</a>';
    }
    if (d.whatsapp) {
      var msg = 'Hola ' + (d.nombre || '') + ', vi tu QR y me interesa agendar una clase';
      html += '<a class="btn btn-wa" href="https://wa.me/' + d.whatsapp + '?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener">' + WA_SVG + 'WhatsApp</a>';
    }
    document.getElementById('btns').innerHTML = html;
    card.style.display = 'block';
  }

  function showErr(m) {
    card.style.display = 'none';
    errMsg.textContent = m;
    errBox.style.display = 'block';
  }
})();
