import SectionHeading from '../ui/SectionHeading';
import { getIcon } from '../../utils/icons';

export default function Products({ products = [] }) {
  return (
    <section id="modules" className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Products"
          title="Finance Asset Recovery Products"
          subtitle="Professional recovery solutions for every type of finance asset across India."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => {
            const Icon = getIcon(product.icon);
            return (
              <article
                key={product.title}
                className="rounded-2xl border border-slate-100 bg-surface p-5 transition hover:border-brand/30 hover:bg-white hover:shadow-md"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-brand shadow-sm">
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-ink">{product.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{product.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
