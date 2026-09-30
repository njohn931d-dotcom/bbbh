/*! Worth embed loader (MIT). One line, an iframe that sizes itself.
 * Usage:
 *   <div data-worth-embed="cost-of-time"></div>
 *   <script async src="https://<host>/bbbh/embed/widget.js" data-tool="cost-of-time"></script>
 * Optional: data-height (px floor), data-src (absolute widget URL override).
 */
(function () {
  var script = document.currentScript || (function () {
    var all = document.getElementsByTagName('script');
    for (var i = all.length - 1; i >= 0; i--) if (/embed\/widget\.js$/.test(all[i].src)) return all[i];
    return null;
  })();
  if (!script) return;
  var origin = script.src.replace(/\/embed\/widget\.js.*$/, '');
  var slug = script.getAttribute('data-tool') || 'cost-of-time';
  var floor = parseInt(script.getAttribute('data-height') || '480', 10);
  var url = script.getAttribute('data-src') || (origin + '/embed/' + slug + '/');

  function mount(el) {
    if (el.getAttribute('data-worth-mounted')) return;
    el.setAttribute('data-worth-mounted', '1');
    var frame = document.createElement('iframe');
    frame.src = url;
    frame.title = 'Worth ' + slug.replace(/-/g, ' ') + ' calculator';
    frame.loading = 'lazy';
    frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    frame.style.cssText = 'width:100%;min-height:' + floor + 'px;border:1px solid #e0e4d7;border-radius:14px;overflow:hidden;display:block';
    el.appendChild(frame);
  }

  window.addEventListener('message', function (event) {
    var data = event.data || {};
    if (!data || data.type !== 'worth-embed-resize' || !data.height) return;
    var frames = document.getElementsByTagName('iframe');
    for (var i = 0; i < frames.length; i++) {
      if (frames[i].contentWindow === event.source) {
        frames[i].style.minHeight = Math.max(floor, data.height) + 'px';
      }
    }
  });

  function scan() {
    var nodes = document.querySelectorAll('[data-worth-embed]');
    for (var i = 0; i < nodes.length; i++) {
      var want = nodes[i].getAttribute('data-worth-embed') || slug;
      if (want === slug) mount(nodes[i]);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
