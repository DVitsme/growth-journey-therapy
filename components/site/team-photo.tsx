import Image from "next/image";

export type TeamCard = {
  name: string;
  /** Post-nominal credentials (e.g. "MS ODL, MS CMHC, LAPC"). When present they take the
   *  plate's compact descriptor slot; the spelled-out title still shows beside the bio. */
  credentials?: string;
  title?: string;
  languages?: string;
  /** CSS object-position for framing the headshot inside the fixed card, e.g. "50% 20%". */
  objectPosition?: string;
};

/**
 * A team member headshot card that reproduces, in the browser, the branded green name
 * plate the practice used to build by hand in Photoshop: a fixed-size photo (648×705)
 * with a green box three-quarters down carrying the name, title and languages, a strip
 * of the headshot left visible below it, and rounded corners.
 *
 * The label is real text (not baked into the image) so it stays crisp at any zoom, is
 * translatable for the ES site, and is readable by assistive tech. Text is sized in
 * container-query units (`cqi`) so the plate keeps the same proportions whether the card
 * renders wide (desktop) or narrow (tablet column) — adding a member is now just a raw
 * photo plus these fields.
 */
export function TeamPhoto({
  image,
  name,
  credentials,
  title,
  languages,
  objectPosition = "50% 20%",
  priority,
}: TeamCard & { image: string; priority?: boolean }) {
  return (
    <div className="@container relative mx-auto aspect-[648/705] w-full overflow-hidden rounded-2xl shadow-md">
      <Image
        src={image}
        alt={name}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
        style={{ objectPosition }}
      />
      <div className="absolute inset-x-0 bottom-[6.1%] bg-green px-[6cqi] py-[3.6cqi] text-center text-white">
        <p className="font-display text-[7cqi] font-bold leading-[1.05]">{name}</p>
        {/* Post-nominals take the compact slot; a long spelled-out title would crowd the plate. */}
        {credentials ? (
          <p className="mt-[0.9cqi] text-[3.4cqi] font-semibold leading-tight">{credentials}</p>
        ) : (
          title && <p className="mt-[1cqi] text-[3.5cqi] leading-tight">{title}</p>
        )}
        {languages && <p className="text-[3.5cqi] font-semibold leading-tight">{languages}</p>}
      </div>
    </div>
  );
}
