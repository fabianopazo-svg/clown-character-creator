import { createContext, useContext, useReducer } from 'react';
import core from '../data/core.json';

const emptyAttributes = Object.fromEntries(core.attributes.map(a => [a.id, 0]));
const emptySkills = Object.fromEntries(core.skills.map(s => [s.id, 0]));

export const initialCharacter = {
  humanName: '',
  occupation: '',
  age: '',
  ageBandId: '',
  ringName: '',
  callingText: '',
  troupeId: '',
  pathId: '',
  subtypeId: '',
  renown: 1,
  tentBorn: { isTentBorn: false, secondTroupeId: '' },
  attributes: { ...emptyAttributes },
  skills: { ...emptySkills },
  performanceDots: 0,
  specialties: [],
  insecurities: [],
  personalityTraits: [],
  gifts: [],
  pathResourceNotes: '',
  gear: [],
  purseCurrent: null,
  clown: { makeup: '', humanDescription: '', relationshipToFace: '', gettingReadyId: 'full' },
  backstory: { crypticSign: '', keepingTruthFrom: '', motleyWorn: '' },
};

function characterReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_NESTED': {
      const { group, field, value } = action;
      return { ...state, [group]: { ...state[group], [field]: value } };
    }
    case 'SET_ATTRIBUTE':
      return { ...state, attributes: { ...state.attributes, [action.id]: action.value } };
    case 'SET_SKILL':
      return { ...state, skills: { ...state.skills, [action.id]: action.value } };
    case 'TOGGLE_LIST_ITEM': {
      // action: { field, value, max }
      const list = state[action.field];
      const exists = list.includes(action.value);
      let next;
      if (exists) {
        next = list.filter(v => v !== action.value);
      } else {
        if (action.max && list.length >= action.max) return state;
        next = [...list, action.value];
      }
      return { ...state, [action.field]: next };
    }
    case 'SET_LIST_TEXT': {
      // action: { field, index, value }
      const list = [...state[action.field]];
      list[action.index] = action.value;
      return { ...state, [action.field]: list };
    }
    case 'ADD_LIST_TEXT': {
      const list = [...state[action.field], ''];
      return { ...state, [action.field]: list };
    }
    case 'REMOVE_LIST_INDEX': {
      const list = state[action.field].filter((_, i) => i !== action.index);
      return { ...state, [action.field]: list };
    }
    case 'RESET':
      return { ...initialCharacter };
    default:
      return state;
  }
}

const CharacterContext = createContext(null);

export function CharacterProvider({ children }) {
  const [character, dispatch] = useReducer(characterReducer, initialCharacter);
  return (
    <CharacterContext.Provider value={{ character, dispatch }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const ctx = useContext(CharacterContext);
  if (!ctx) throw new Error('useCharacter must be used within CharacterProvider');
  return ctx;
}
