export type AideCpfStep = {
  id: number;
  image: string;
  title: string;
  instruction: string;
  hint?: string;
};

export const AIDE_CPF_STEPS: AideCpfStep[] = [
  {
    id: 1,
    image: "/aide-cpf/step-1.png",
    title: "Connectez-vous a Mon Compte Formation",
    instruction: "Touchez le bouton pour vous identifier avec FranceConnect+.",
    hint: "FranceConnect+ sert a proteger votre compte.",
  },
  {
    id: 2,
    image: "/aide-cpf/step-2.png",
    title: "Choisissez votre identite numerique",
    instruction: "Touchez le service que vous utilisez deja.",
    hint: "Vous pouvez choisir La Poste, impots.gouv.fr, Ameli ou un autre service propose.",
  },
  {
    id: 3,
    image: "/aide-cpf/step-3.png",
    title: "Entrez votre numero de telephone",
    instruction: "Touchez la zone vide, puis ecrivez votre numero.",
    hint: "Utilisez le numero lie a votre identite numerique.",
  },
  {
    id: 4,
    image: "/aide-cpf/step-4.png",
    title: "Validez votre numero",
    instruction: "Verifiez le numero, puis touchez le bouton de connexion.",
    hint: "Gardez votre telephone pres de vous pour confirmer la demande.",
  },
  {
    id: 5,
    image: "/aide-cpf/step-5.png",
    title: "Confirmez sur votre application",
    instruction: "Ouvrez la notification et acceptez la connexion.",
    hint: "Ne donnez jamais votre code ou votre mot de passe au conseiller.",
  },
  {
    id: 6,
    image: "/aide-cpf/step-6.png",
    title: "Lisez votre solde CPF",
    instruction: "Regardez le montant en euros affiche sur la page d'accueil.",
    hint: "Donnez seulement le montant au conseiller. Il le saisira dans votre dossier.",
  },
];
