/** Plain-English explanations shown on the home page, product pages and the policies page. */

export const CONDITION_TEXT: Record<string, string> = {
  new: "Brand new and unused, with all accessories.",
  "open-box": "Box opened but practically unused, accessories complete.",
  "like-new": "No visible marks or scratches, excellent battery.",
  excellent: "Very light marks only, clean screen and body.",
  good: "Normal signs of daily use, everything works properly.",
  fair: "Visible scratches or dents but fully working, priced lower.",
};

/** How close to perfect each grade is, out of 10. Used for the grade bars. */
export const CONDITION_SCORE: Record<string, number> = {
  new: 10,
  "open-box": 10,
  "like-new": 9.5,
  excellent: 9,
  good: 8,
  fair: 7,
};

export const PTA_TEXT: Record<string, string> = {
  pta: "Registered with PTA and works on any local SIM.",
  "non-pta":
    "Not PTA registered. PTA tax has to be paid by the customer to keep using a local SIM beyond the allowed period. Priced lower.",
  jv: "A JV set. Please confirm SIM and network support with us before ordering.",
};

/** Short warning shown on a product page for phones that are not PTA approved. */
export const PTA_NOTES: Record<string, string> = {
  "non-pta":
    "This phone is not PTA approved. PTA tax must be paid to keep using a local SIM beyond the allowed period. Please ask us if you are unsure.",
  jv: "This is a JV set. Please confirm SIM and network support with us on WhatsApp before ordering.",
};
