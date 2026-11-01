import SellLandForm from '../../../components/SellLandForm';

export default function BackTaxesPage() {
  return (
    <SellLandForm
      landingPage="back-taxes"
      headline="Tired of Paying Taxes on Land You Don't Use?"
      subhead="Stop paying taxes on vacant land you're not using. No listing, no realtor, no 6-12 month wait. A fair offer and a sure closing. We buy parcels 2 acres and up and work with out-of-state owners every day."
      bullets={[
        "Owe back taxes? We can still make an offer",
        "We handle the title and closing",
        "No fees or commissions",
        "Close on your timeline"
      ]}
    />
  );
}
