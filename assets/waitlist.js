/* "Get notified" (founder, 23 Sep 2026).
 *
 * Every Get notified link keeps its mailto: href, so a visitor without
 * JavaScript still has a way to ask. With it, the click opens a small form
 * that posts an email and an area to /v1/waitlist on this same origin (Caddy
 * routes it to the API). If the post cannot reach the API - the GitHub Pages
 * fallback host has none - the form says so and offers the email instead.
 */
(function () {
  var dlg = document.getElementById('wl');
  if (!dlg || typeof dlg.showModal !== 'function') return;

  var form = document.getElementById('wlForm');
  var status = document.getElementById('wlStatus');
  var submit = form.querySelector('button[type="submit"]');
  var MAILTO = 'mailto:info@fleekart.com?subject=Notify%20me%20when%20Fleekart%20launches';

  function say(text, kind) {
    status.textContent = text;
    status.className = 'wl__status' + (kind ? ' wl__status--' + kind : '');
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="mailto:"][data-waitlist]');
    if (!a) return;
    e.preventDefault();
    form.hidden = false;
    say('');
    dlg.showModal();
    form.email.focus();
  });

  dlg.addEventListener('click', function (e) {
    if (e.target === dlg || e.target.closest('[data-wl-close]')) dlg.close();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    submit.disabled = true;
    say('Saving…');
    fetch('/v1/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email.value.trim(),
        area: form.area.value.trim() || null,
        website: form.website.value || null
      })
    })
      .then(function (r) {
        if (r.status === 202) {
          form.reset();
          form.hidden = true;
          say("You're on the list. We'll email you once, on launch day.", 'ok');
        } else if (r.status === 422) {
          say('Please check your email address.', 'err');
        } else if (r.status === 429) {
          say('Too many sign-ups from this network. Please try again later.', 'err');
        } else {
          throw new Error(String(r.status));
        }
      })
      .catch(function () {
        status.className = 'wl__status wl__status--err';
        status.textContent = 'Could not save right now. ';
        var link = document.createElement('a');
        link.href = MAILTO;
        link.textContent = 'Email us instead';
        status.appendChild(link);
      })
      .then(function () { submit.disabled = false; });
  });
})();
