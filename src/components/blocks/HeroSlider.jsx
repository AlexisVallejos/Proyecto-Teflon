import React from 'react';

export default function HeroSlider() {
    return (
        <section className="px-10 py-8">
            <div className="mx-auto max-w-[1280px]">
                <div className="relative overflow-hidden rounded-xl bg-background-dark">
                    <div
                        className="flex min-h-[520px] flex-col justify-center gap-6 bg-cover bg-center bg-no-repeat px-16 py-12"
                        style={{
                            backgroundImage:
                                'linear-gradient(90deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.2) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAsE3UyUs8hwy2ulbda_AkoJgM8Dt4ADPYbA-N4JuZyG7V0vY4q6cc-Tt89t4P27xMxKmcjbMRSj4N02izzDB8sxKnPwkQT6oyUKxlUSIDxrIG34D9wU86tDWjBT-0y3V2Z_OLjdxCgq5XnSZfNN_gaFHdyDgF3Yqu1LH2AdPc8uRelPjbm_EzN2gggEAeP5ZoaAymWqHgYvaOW7zs6nmpnzlMDbxoDHw2MGpOOxIcYt6nSxjDnngClgvhP9eojjcdPz_JpCIAFFZA")',
                        }}
                        role="img"
                        aria-label="Showroom de baños con grifería y sanitarios premium"
                    >
                        <div className="max-w-2xl space-y-4">
                            <span className="inline-block rounded-full bg-primary/20 px-4 py-1 text-sm font-bold uppercase tracking-wider text-primary border border-primary/30">
                                Calidad premium
                            </span>
                            <h1 className="text-5xl font-black leading-tight tracking-tight text-white lg:text-6xl">
                                Soluciones profesionales en sanitarios y grifería
                            </h1>
                            <p className="text-lg font-normal leading-relaxed text-white/80">
                                Equipamiento de calidad para tu hogar y obras
                                profesionales. Experiencia local con entregas rápidas.
                            </p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => (window.location.hash = '#catalog')}
                                className="flex items-center justify-center rounded-lg h-12 px-8 bg-primary text-white text-base font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                            >
                                Comprar ahora
                            </button>
                            <button
                                type="button"
                                onClick={() => (window.location.hash = '#catalog')}
                                className="flex items-center justify-center rounded-lg h-12 px-8 bg-white/10 text-white text-base font-bold backdrop-blur-md hover:bg-white/20 transition-all border border-white/20"
                            >
                                Ver catálogo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
