(() => {
  const form = document.querySelector("#inquiry-form");
  const status = document.querySelector("#form-status");
  const interest = document.querySelector("#interest");
  const contactEmail = (window.SITE_CONFIG?.contactEmail || "").trim();

  document.querySelector("#current-year").textContent = new Date().getFullYear();

  document.querySelectorAll("[data-package]").forEach((link) => {
    link.addEventListener("click", () => {
      const packageName = link.dataset.package;
      const option = [...interest.options].find((item) => item.value === packageName);
      if (option) interest.value = packageName;
    });
  });

  const inquiryText = (data) => [
    "Hello,",
    "",
    "I'd like to discuss a Forge Workspace setup.",
    "",
    `Name: ${data.get("name")}`,
    `Work email: ${data.get("email")}`,
    `Team or company: ${data.get("company") || "Not provided"}`,
    `Team size: ${data.get("teamSize") || "Not provided"}`,
    `Interested in: ${data.get("interest") || "Not sure yet"}`,
    "",
    "Workflow:",
    data.get("message"),
    ""
  ].join("\n");

  async function copyInquiry(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();
    if (!copied) throw new Error("Clipboard access is unavailable.");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    status.classList.remove("is-error");

    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const body = inquiryText(data);
    const subject = `Workspace setup inquiry — ${data.get("company") || data.get("name")}`;

    if (contactEmail) {
      const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      status.textContent = "Your email app should open with the request ready to review and send.";
      return;
    }

    try {
      await copyInquiry(body);
      status.textContent = "Demo mode: your inquiry was copied to the clipboard, but it was not sent. Add a real inbox in site-config.js before publishing.";
    } catch (error) {
      status.classList.add("is-error");
      status.textContent = "This demo has no connected inbox yet. Add a contact email in site-config.js before publishing.";
    }
  });
})();
