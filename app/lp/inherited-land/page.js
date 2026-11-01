import SellLandForm from '../../../components/SellLandForm';

export default function InheritedLandPage() {
  return (
    <SellLandForm
      landingPage="inherited-land"
      headline="Inherited Land You Don't Want to Keep?"
      subhead="Own inherited land that's far from home and costing you taxes every year? Skip the 6-12 months a listing takes. No realtor, no showings. Just a fair offer and a closing you can count on. We buy parcels 2 acres and up and work with out-of-state owners every day."
      bullets={[
        "We handle multiple heirs, title & probate paperwork",
        "Behind on taxes? We can still help",
        "A fair offer, clearly explained",
        "You pick the closing date"
      ]}
    />
  );
}
