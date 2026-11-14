const steps = [
  {
    n: '01',
    title: 'Choose a gift',
    description: 'Pick from custom keychains, desk nameplates, and precision industrial keepsakes.',
  },
  {
    n: '02',
    title: 'Personalise in 3D',
    description: 'Add custom names and phrases. Rotate the live 3D geometry to inspect every layer and dimension.',
  },
  {
    n: '03',
    title: 'We make and ship',
    description: 'Manufactured to strict tolerances, hand finished, and dispatched in gift-ready protection.',
  },
]

export default function HowItWorks() {
  return (
    <section className="bg-alt py-21 max-[1040px]:py-16 max-[760px]:py-12 border-y border-line">
      <div className="mx-auto max-w-[1400px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px]">
        
        {/* Section Header */}
        <div className="mb-9 max-[760px]:mb-6">
          <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent">
            How it works
          </span>
          <h2 className="font-display text-[38px] max-[760px]:text-[28px] font-semibold text-ink leading-[1.12] tracking-[-0.02em] mt-3">
            Three steps to something personal
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 min-[761px]:grid-cols-3 gap-6">
          {steps.map((item) => (
            <div
              key={item.n}
              className="rounded-card border border-line bg-surface p-7 flex flex-col justify-between"
            >
              <div className="font-display text-[44px] font-semibold text-accent/90 leading-none tracking-[-0.02em]">
                {item.n}
              </div>
              <div className="mt-5">
                <h3 className="font-sans text-[19px] font-semibold text-ink m-0 leading-snug">
                  {item.title}
                </h3>
                <p className="font-sans text-[15px] text-muted mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
