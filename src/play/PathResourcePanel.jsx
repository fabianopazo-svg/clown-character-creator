import ResourcePool from './ResourcePool';
import CardsWidget from './CardsWidget';
import StanceGritWidget from './StanceGritWidget';

export default function PathResourcePanel({ path, renown, play, onUpdateResource, readOnly = false }) {
  if (!path) return null;
  const update = readOnly ? () => {} : onUpdateResource;

  switch (path.resourceType) {
    case 'comfort':
      return (
        <ResourcePool
          label={path.pathResource.name}
          description={path.pathResource.description}
          value={play.pathResource.comfort}
          onChange={v => update('comfort', v)}
          disabled={readOnly}
        />
      );
    case 'laughter_and_debt':
      return (
        <ResourcePool
          label={path.pathResource.name}
          description={path.pathResource.description}
          value={play.pathResource.debt}
          onChange={v => update('debt', v)}
          thresholds={path.pathResource.thresholds}
          disabled={readOnly}
        />
      );
    case 'conviction':
      return (
        <ResourcePool
          label={path.pathResource.name}
          description={path.pathResource.description}
          value={play.pathResource.conviction}
          onChange={v => update('conviction', v)}
          disabled={readOnly}
        />
      );
    case 'cards':
      return (
        <CardsWidget
          renown={renown}
          value={play.pathResource.cardsInHand}
          onChange={v => update('cardsInHand', v)}
          disabled={readOnly}
        />
      );
    case 'stance_and_grit':
      return (
        <StanceGritWidget
          health={play.health}
          healthMax={play.healthMax}
          stance={play.pathResource.stance}
          onChangeStance={v => update('stance', v)}
          disabled={readOnly}
        />
      );
    default:
      // Host / Illusionist — no separate pool; Laughter covers everything.
      return (
        <div className="gift-card">
          <span className="gift-name">{path.pathResource?.name}</span>
          <div className="gift-effect">{path.pathResource?.description}</div>
          <div className="helper-text" style={{ marginTop: 6 }}>
            No separate pool to track — Gifts draw directly from Laughter above.
          </div>
        </div>
      );
  }
}
