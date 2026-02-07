import React from "react";

function ServiceCard({ icon, title, text, styles = {} }) {
  const {
    cardBg = "bg-white dark:bg-[#3d2e21]",
    iconColor = "text-primary",
    iconBg = "bg-primary/10",
    titleSize = "text-xl",
    textColor = "text-[#8a7560] dark:text-white/60",
  } = styles;

  const ICON_MAP = {
    support_agent: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14c0 2 1.5 3 3.5 3 2 0 3.5-1 3.5-3s-1.5-3-3.5-3c-2 0-3.5 1-3.5 3z"></path><path d="M12 14c0 2 1.5 3 3.5 3 2 0 3.5-1 3.5-3s-1.5-3-3.5-3c-2 0-3.5 1-3.5 3z"></path><path d="M7 11V7a5 5 0 0 1 10 0v4"></path><path d="M12 17v4"></path><path d="M8 21h8"></path></svg>
    ),
    local_shipping: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
    ),
    construction: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
    )
  };

  return (
    <div className={`flex flex-col items-center text-center p-8 rounded-2xl shadow-sm ${cardBg}`}>
      <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
        {ICON_MAP[icon] || icon}
      </div>
      <h3 className={`${titleSize} font-bold mb-2 dark:text-white`}>{title}</h3>
      <p className={textColor}>{text}</p>
    </div>
  );
}

export default function Services({
  title = "Our Professional Services",
  subtitle = "Beyond products, we provide the support you need for your projects to succeed.",
  items = [
    { icon: "support_agent", title: "Expert Advice", text: "Our technical team helps you choose the right materials for any plumbing or hardware project." },
    { icon: "local_shipping", title: "Fast Shipping", text: "Same-day local delivery in Mar del Plata and express nationwide shipping for all orders." },
    { icon: "construction", title: "Technical Support", text: "Installation guides and post-purchase technical support for all our premium grifería brands." }
  ],
  styles = {}
}) {
  const {
    alignment = "text-center",
    titleSize = "text-3xl",
    subtitleSize = "text-base",
    titleColor = "text-[#181411] dark:text-white",
    subtitleColor = "text-[#8a7560] dark:text-white/60",
    sectionBg = "bg-[#f0edea] dark:bg-[#2a1f14]",
    cardStyles = {}
  } = styles;

  return (
    <section className={`px-10 py-16 ${sectionBg}`}>
      <div className="mx-auto max-w-[1280px]">
        <div className={`mb-12 ${alignment}`}>
          <h2 className={`${titleSize} font-bold tracking-tight ${titleColor}`}>
            {title}
          </h2>
          <p className={`${subtitleSize} ${subtitleColor} max-w-2xl mt-2 ${alignment === 'text-center' ? 'mx-auto' : ''}`}>
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <ServiceCard
              key={i}
              icon={item.icon}
              title={item.title}
              text={item.text}
              styles={cardStyles}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

