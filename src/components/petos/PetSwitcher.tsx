import type { Pet } from "../../types";

export interface PetSwitcherProps {
  pets: Pet[];
  selectedPetId: number | null;
  onSelect: (id: number) => void;
}

function speciesEmoji(species: Pet["species"]): string {
  if (species === "dog") return "🐕";
  if (species === "cat") return "🐈";
  return "🐾";
}

function petAvatarUrl(pet: Pet): string | null {
  return pet._resolved_avatar_url || pet.avatar_url || pet.image_url || null;
}

export default function PetSwitcher({
  pets,
  selectedPetId,
  onSelect,
}: PetSwitcherProps) {
  return (
    <div className="petos-pet-switcher" data-testid="petos-pet-switcher">
      {pets.map((pet) => {
        const isOn = pet.id === selectedPetId;
        const url = petAvatarUrl(pet);
        return (
          <button
            key={pet.id}
            type="button"
            className={
              isOn
                ? "petos-pet-switcher__item petos-pet-switcher__item--on"
                : "petos-pet-switcher__item"
            }
            onClick={() => onSelect(pet.id)}
            aria-current={isOn ? "true" : undefined}
            aria-label={pet.name}
          >
            <span className="petos-pet-switcher__avatar">
              {url ? (
                <img src={url} alt="" />
              ) : (
                <span className="petos-pet-switcher__emoji" aria-hidden="true">
                  {speciesEmoji(pet.species)}
                </span>
              )}
            </span>
            <span className="petos-pet-switcher__name">{pet.name}</span>
          </button>
        );
      })}
    </div>
  );
}
