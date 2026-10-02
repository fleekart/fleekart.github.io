/* Invite links (2 Oct 2026).
 *
 * The app's Refer & Earn sends `https://fleekart.com/?ref=FLK-XXXXXXX`. The
 * site ignored the `ref`, so a friend who arrived by invite lost the code the
 * moment they left the message. Now: the code is shown at the top with a
 * Copy button and the line saying where it goes in the app, it is remembered
 * for later visits, and "Get notified" sends it with the sign-up so the
 * founder can see who invited whom (waitlist.js reads window.fkInviteCode).
 *
 * Only a code-shaped value is accepted; anything else in `ref` is ignored, so
 * a crafted link cannot put arbitrary text on the page. Text goes in through
 * textContent, never innerHTML.
 */
(function () {
  var KEY = 'fk_invite_ref';
  var SHAPE = /^(?:FLK-?)?([A-Z0-9]{5,12})$/;

  function clean(raw) {
    if (!raw) return null;
    var m = String(raw).trim().toUpperCase().replace(/\s+/g, '').match(SHAPE);
    return m ? 'FLK-' + m[1] : null;
  }

  var fromLink = null;
  try { fromLink = clean(new URLSearchParams(window.location.search).get('ref')); } catch (e) {}
  var stored = null;
  try { stored = clean(window.localStorage.getItem(KEY)); } catch (e) {}
  var code = fromLink || stored;
  if (!code) return;
  try { window.localStorage.setItem(KEY, code); } catch (e) {}
  window.fkInviteCode = code;

  var bar = document.createElement('div');
  bar.className = 'invite';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Your invite');

  var text = document.createElement('p');
  text.className = 'invite__text';
  var lead = document.createElement('b');
  lead.textContent = 'You were invited to Fleekart. ';
  text.appendChild(lead);
  text.appendChild(document.createTextNode('Your friend’s code is '));
  var chip = document.createElement('span');
  chip.className = 'invite__code';
  chip.textContent = code;
  text.appendChild(chip);
  text.appendChild(document.createTextNode(
    ' — after you sign up in the app, enter it on “Were you invited?” so they get their Plinks.'
  ));

  var copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'invite__copy';
  copy.textContent = 'Copy code';
  copy.addEventListener('click', function () {
    var done = function () { copy.textContent = 'Copied'; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(done, function () { copy.textContent = code; });
    } else {
      copy.textContent = code;
    }
  });

  var close = document.createElement('button');
  close.type = 'button';
  close.className = 'invite__close';
  close.setAttribute('aria-label', 'Hide');
  close.textContent = '×';
  var closed = false;
  close.addEventListener('click', function () {
    closed = true;
    bar.remove();
    document.body.style.paddingBottom = '';
  });

  bar.appendChild(text);
  bar.appendChild(copy);
  bar.appendChild(close);

  // The page is a Next.js export: hydration can replace <body>'s children
  // after this runs and take the bar with it (seen at 412px and 1280px on
  // 2 Oct). Put it back whenever it goes missing, unless it was closed.
  // Fixed to the bottom (the site's header owns the top); the page gets the
  // bar's height as padding so the footer is never under it.
  function mount() {
    if (closed) return;
    if (!bar.isConnected) document.body.appendChild(bar);
    document.body.style.paddingBottom = bar.offsetHeight + 'px';
  }
  window.addEventListener('resize', mount);
  mount();
  if (window.MutationObserver) {
    new MutationObserver(mount).observe(document.body, { childList: true });
  }
  window.addEventListener('load', mount);
})();
