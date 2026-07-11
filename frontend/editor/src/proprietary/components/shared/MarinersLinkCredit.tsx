import marinersLinkLogo from "@app/assets/marinerslink-logo.svg";

/**
 * "Developed by MarinersLink.com" credit shown at the bottom of the login
 * portal only (wired in via AuthLayout, not the global app Footer).
 */
export default function MarinersLinkCredit() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.15rem",
        marginTop: "0.5rem",
        paddingBottom: "0.25rem",
        fontSize: "0.75rem",
        lineHeight: 1.4,
        color: "var(--text-muted, #6b7280)",
        textAlign: "center",
      }}
    >
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
      >
        <img
          src={marinersLinkLogo}
          alt="MarinersLink"
          width={18}
          height={18}
          style={{ display: "block" }}
        />
        <span>
          Developed by{" "}
          <a
            href="https://marinerslink.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", fontWeight: 600 }}
          >
            MarinersLink.com
          </a>
        </span>
      </span>
      <a href="mailto:support@marinerslink.com" style={{ color: "inherit" }}>
        support@marinerslink.com
      </a>
    </div>
  );
}
