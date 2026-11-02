/* Čistý interiér – sdílený skript: konverze Google Ads + odeslání poptávky. */
(function () {
  var ADS = "AW-18550688496";
  function conversion(label) {
    if (typeof window.gtag === "function") window.gtag("event", "conversion", { send_to: ADS + "/" + label });
  }

  // Konverze: klik na telefon (všechny tel: odkazy)
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (a) conversion("8b8lCKbpnLAdEPCV1I1F");
  });

  // Ukázky prací: kliknutí na auto nebo fotku otevře galerii
  var lb = document.getElementById("lightbox");
  if (lb && lb.showModal) {
    var lbImg = lb.querySelector("img"), lbCap = lb.querySelector("figcaption"), set = [], cur = 0;
    var show = function (i) {
      cur = (i + set.length) % set.length;
      var a = set[cur], img = a.querySelector("img");
      lbImg.src = a.href; lbImg.alt = img.alt;
      lbCap.textContent = img.alt + " (" + (cur + 1) + "/" + set.length + ")";
    };
    var open = function (key, i) {
      set = Array.prototype.slice.call(document.querySelectorAll('.work-photo[data-gallery="' + key + '"]'));
      if (!set.length) return;
      show(i || 0); lb.showModal();
    };
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest(".work-photo");
      if (a) { e.preventDefault(); var g = a.getAttribute("data-gallery"); var all = document.querySelectorAll('.work-photo[data-gallery="' + g + '"]'); open(g, Array.prototype.indexOf.call(all, a)); return; }
      var b = e.target.closest && e.target.closest(".work-open");
      if (b) open(b.getAttribute("data-open"), 0);
    });
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(cur - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { show(cur + 1); });
    lb.querySelector(".lb-close").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(cur - 1);
      if (e.key === "ArrowRight") show(cur + 1);
    });
    var sx = null;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1));
    });
  }

  // Poptávkový formulář (jen na stránkách, kde je)
  var form = document.getElementById("order-form");
  if (!form) return;
  var status = document.getElementById("f-status");
  var submit = document.getElementById("f-submit");
  var setStatus = function (text, cls) { status.textContent = text; status.className = "form-status " + (cls || ""); };

  // Předvyplnění balíčku z odkazu, např. /objednavka?balicek=zaklad
  try {
    var pick = new URLSearchParams(location.search).get("balicek");
    var sel = form.elements["package"];
    var plain = function (s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
    if (pick && sel) {
      for (var i = 0; i < sel.options.length; i++) {
        if (plain(sel.options[i].text).indexOf(plain(pick)) === 0) { sel.selectedIndex = i; break; }
      }
    }
  } catch (err) { /* ignore */ }

  /* Poptávka se posílá na Cloudflare Worker (/api/poptavka), který ji přepošle do Telegramu. */
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var d = Object.fromEntries(new FormData(form));
    if (d.web) return; // spam bot
    var name = form.elements.name, phone = form.elements.phone;
    var nameOk = !!d.name.trim(), phoneOk = d.phone.replace(/\D/g, "").length >= 9;
    name.setAttribute("aria-invalid", !nameOk);
    phone.setAttribute("aria-invalid", !phoneOk);
    if (!nameOk || !phoneOk) {
      setStatus("Vyplňte prosím jméno a telefon, ať vám můžeme zavolat.", "err");
      (nameOk ? phone : name).focus();
      return;
    }
    submit.disabled = true;
    setStatus("Odesílám…");
    try {
      var r = await fetch("/api/poptavka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d)
      });
      if (!r.ok) throw new Error(r.status);
      form.reset();
      conversion("K-dzCKPpnLAdEPCV1I1F");
      setStatus("Děkujeme, poptávka odešla. Ozveme se vám co nejdřív.", "ok");
    } catch (err) {
      setStatus("Poptávku se nepodařilo odeslat. Zavolejte nám prosím na +420 722 297 759.", "err");
    } finally {
      submit.disabled = false;
    }
  });
})();
