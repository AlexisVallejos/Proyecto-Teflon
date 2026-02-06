import React from "react";

function ServiceCard({ icon, title, text }) {
  return (
    <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-4xl">{icon}</span>
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-[#8a7560]">{text}</p>
    </div>
  );
}

export default function Services() {
  return (
    <section className="px-4 md:px-10 py-16 bg-[#f0edea]">
      <div className="mx-auto max-w-[1280px]">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Nuestros servicios profesionales
          </h2>
          <p className="text-[#8a7560] max-w-2xl mx-auto mt-2">
            Además de productos, ofrecemos el soporte que necesitás para que tus
            proyectos sean un éxito.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ServiceCard
            icon="support_agent"
            title="Asesoramiento experto"
            text="Nuestro equipo técnico te ayuda a elegir los materiales correctos para cada proyecto."
          />
          <ServiceCard
            icon="local_shipping"
            title="Envíos rápidos"
            text="Entrega local en el día y envíos express a todo el país."
          />
          <ServiceCard
            icon="construction"
            title="Soporte técnico"
            text="Guías de instalación y asistencia postventa para nuestras marcas premium."
          />
        </div>
      </div>
    </section>
  );
}
