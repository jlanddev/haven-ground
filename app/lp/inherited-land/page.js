import SellLandForm from '../../../components/SellLandForm';

export default function InheritedLandPage() {
  return (
    <SellLandForm
      landingPage="inherited-land"
      headline="Inherited Land You Don't Want to Keep?"
      subhead="Too much land, far from home, with taxes due every year? Skip the 6–12 months a listing takes — no realtor, no showings, just a fair offer and a closing you can count on. We buy land 2+ acres, and you can live anywhere."
      bullets={[
        "We handle multiple heirs, title & probate paperwork",
        "Behind on taxes? We can still help",
        "A fair offer, clearly explained",
        "You pick the closing date"
      ]}
    />
  );
}
