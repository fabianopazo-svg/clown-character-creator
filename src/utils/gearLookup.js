import gear from '../data/gear.json';

export function allGearItems() {
  const mundane = gear.mundaneGear.map(g => ({ ...g, category: 'Mundane gear' }));
  const props = gear.classicClownProps.map(g => ({ ...g, category: 'Classic clown props' }));
  const troupeGear = gear.troupeGear.map(g => ({ ...g, category: 'Troupe gear' }));
  return [...mundane, ...props, ...troupeGear];
}

export function findGearItem(name) {
  return allGearItems().find(g => g.name === name) || null;
}
