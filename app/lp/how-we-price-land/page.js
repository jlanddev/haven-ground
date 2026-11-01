import SellLandForm from '../../../components/SellLandForm';

export default function HowWePriceLandPage() {
  return (
    <SellLandForm
      landingPage="how-we-price-land"
      headline="How We Price Your Land"
      subhead="Inherited it, own too much of it, or just tired of the taxes? No guesswork, no pressure. We look at your parcel, explain what we can pay and why, and give you a fair offer you can actually understand, then a closing you can count on. We buy parcels 2 acres and up and work with out-of-state owners every day."
      bullets={[
        "We research comparable land sales",
        "We factor acreage, access, and use",
        "We explain the number, we don't just quote it",
        "No listing, no realtor, no 6-12 month wait"
      ]}
    />
  );
}
