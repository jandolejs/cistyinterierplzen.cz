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
