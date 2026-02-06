import React from 'react';

function ServiceCard({ icon, title, text }) {
    return (
        <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white dark:bg-[#3d2e21] shadow-sm">
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
        <section className="px-10 py-16 bg-[#f0edea] dark:bg-[#2a1f14]">
            <div className="mx-auto max-w-[1280px]">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight">
                        Our Professional Services
                    </h2>
                    <p className="text-[#8a7560] max-w-2xl mx-auto mt-2">
                        Beyond products, we provide the support you need for your
                        projects to succeed.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <ServiceCard
                        icon="support_agent"
                        title="Expert Advice"
                        text="Our technical team helps you choose the right materials for any plumbing or hardware project."
                    />
                    <ServiceCard
                        icon="local_shipping"
                        title="Fast Shipping"
                        text="Same-day local delivery in Mar del Plata and express nationwide shipping for all orders."
                    />
                    <ServiceCard
                        icon="construction"
                        title="Technical Support"
                        text="Installation guides and post-purchase technical support for all our premium grifería brands."
                    />
                </div>
            </div>
        </section>
    );
}
