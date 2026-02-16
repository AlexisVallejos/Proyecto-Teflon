import React from "react";

function ServiceCard({ icon, title, text, description, styles = {} }) {
  const {
    cardBg = "bg-white dark:bg-[#3d2e21]",
    iconColor = "text-primary",
    iconBg = "bg-primary/10",
    titleSize = "text-xl",
    textColor = "text-[#8a7560] dark:text-white/60",
  } = styles;
  const body = text ?? description ?? "";

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

  const isImageUrl = typeof icon === "string" && (
    icon.startsWith("http://") ||
    icon.startsWith("https://") ||
    icon.startsWith("/uploads/") ||
    icon.startsWith("data:")
  );

  let iconNode = null;
  if (React.isValidElement(icon)) {
    iconNode = icon;
  } else if (typeof icon === "string") {
    if (ICON_MAP[icon]) {
      iconNode = ICON_MAP[icon];
    } else if (isImageUrl) {
      iconNode = <img src={icon} alt="" className="h-10 w-10 object-contain" loading="lazy" />;
    } else {
      iconNode = ICON_MAP.support_agent;
    }
  } else {
    iconNode = ICON_MAP.support_agent;
  }

  return (
    <div className={`flex flex-col items-center text-center p-8 rounded-2xl shadow-sm ${cardBg}`}>
      <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
        {iconNode}
      </div>
      <h3 className={`${titleSize} font-bold mb-2 dark:text-white`}>{title}</h3>
      <p className={textColor}>{body}</p>
    </div>
  );
}

export default function Services({
  title = "Servicios profesionales",
  subtitle = "Además de productos, brindamos el soporte que necesitás para que tus proyectos salgan bien.",
  items = [
    { icon: "support_agent", title: "Asesoramiento experto", text: "Nuestro equipo técnico te ayuda a elegir los materiales correctos para cada obra." },
    { icon: "local_shipping", title: "Envío rápido", text: "Entrega local en el día en Mar del Plata y envíos a todo el país." },
    { icon: "construction", title: "Soporte técnico", text: "Guías de instalación y asistencia postventa para nuestras griferías premium." }
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
              description={item.description}
              styles={cardStyles}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
