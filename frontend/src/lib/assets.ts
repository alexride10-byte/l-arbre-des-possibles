const IMG = "https://static.prod-images.emergentagent.com/jobs/5a8bc270-5ed8-4704-a01d-2ff7d09abd2b/images/";
const u = (h: string) => `${IMG}${h}.jpeg`;

export const HERO = u("da9622d979f78bd6841589dcf6d075d02db8a84cc3929ffbd3e33630c64ec0c6");
export const LOGIN_PORTRAIT = u("fe27e5079c202e7dc2d024464c9f9b94fa270bebac2207aeba699c925b6aa9c7");
export const FUTURE = u("d5915a1c85096e219fae7cd3564d712d902d28da8643f49f0f91f369f5961972");

export const PORTRAITS = [
  { id: "leo", label: "Boucles châtain", url: u("1428c7fbe1ac75360614c550743093fe08b975566e34aae9c837e679651a1dd9") },
  { id: "maya", label: "Cheveux longs", url: u("4b9212048f0284c034eede7d1574ede0d16dd34aacffea3f9e91028a01ac4abc") },
  { id: "noah", label: "Sweat turquoise", url: u("ba2413c4dcb2323fd133c9e29cadd78d02d273d89fb5ada2a9ca355155d17419") },
  { id: "ines", label: "Taches de rousseur", url: u("7425f7675be258a7763c8814297f631d2b4095b0d6f90d326908bef38391b58d") },
  { id: "sami", label: "Lunettes rondes", url: u("636d47afc768e3a246e78dd254d51c48e6800459edf22e1a9566d2847214b89b") },
  { id: "lina", label: "Ciré jaune", url: u("940bd2bceb10be9bb87c952e083f98955ee3331584f3e5fbeb01dca5e15646ef") },
  { id: "tom", label: "Casquette verte", url: u("4fa7b9bd2e048ede063e4e564f2a944fd9239f6e4d7ab5525f512242e63147f0") },
  { id: "amira", label: "Foulard lilas", url: u("6b2f02eeff7c64efd58dff5dbc3447046ad6e37cc053b5b2a65d186f097c625f") },
];

export const DOMAIN_ART: Record<string, { img: string; quote: string }> = {
  emotionnel: { img: u("72ede58f05956adc7e1db2da58e6b3c4dbf652e250bdd1e4c05b4ecc113f280f"), quote: "Des émotions bien comprises aujourd'hui, un enfant plus serein demain." },
  cognitif: { img: u("5ce1f0b89390a2f46aa65a838e9a3df73ac0bfd63da512677c5293360e2366c1"), quote: "Chaque question ouvre un nouveau chemin." },
  social: { img: u("257a8e5644cf2c6380416f7ceeb2d99f881bdf12ad8fdc0807b9b1b4fabb0e5e"), quote: "On grandit mieux ensemble." },
  scolaire: { img: u("a79f50ebc33acd2bfc9cc4c22b93105afca3a193570d951bb18370461ff2eae2"), quote: "Apprendre à son rythme, avancer avec envie." },
  sante: { img: u("1f7698dcc283432d2b73f715036963f17e10c1ed0526b4ed57438ddd29ee46b6"), quote: "Un corps reposé, un esprit disponible." },
  autonomie: { img: u("6305aed2b32951791617210041ae6375a10c511c4246e2193dee74eaf64272d8"), quote: "Faire seul, et en être fier." },
  environnement: { img: u("acddebc9fd04c62e7e6abfa0bf3ee6cb7876fa9ab70692bc4f98b9281c3f5f46"), quote: "Des repères stables pour oser explorer." },
};
