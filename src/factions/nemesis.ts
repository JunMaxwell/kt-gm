// Shared text for NEMESIS operatives, from Kill Team: Nemesis Operatives (Custom Builder, pg 20).
//
// Not a faction module — it exports no `cards`/`operatives`, so the loader never sees it. It
// exists because Angron and Farsight carry the *same* core rules, and two copies of a rules
// paragraph is two things to keep in step.
import type { RefCard } from '../compendium'

/** The core rules every NEMESIS operative has, whatever its size or allegiance. */
export const nemesisCore = (size: 'Small' | 'Medium' | 'Large'): RefCard => ({
  kind: 'faction',
  name: 'Nemesis Operative',
  text: `This is a ${size} NEMESIS operative, and NEMESIS operatives are not normal operatives.\n• It ACTIVATES TWICE during each turning point.\n• As a player operative it can spend 5AP per turning point, and ignores all changes to its APL.\n• CONTROL stands in for the APL stat everywhere except spending action points — for determining control of markers, for instance, and for rules comparing a dice result to APL.\n• Extra Defence: whenever an operative is shooting it, collect and roll one additional defence dice — unless it is injured.\n• Bulky: it cannot be placed on Vantage terrain more than 2" above the killzone floor. Whenever it performs the Fight action, the distance requirements of its control range can be changed to 1" horizontally and 4" vertically. It can move through other operatives, excluding other NEMESIS operatives.\n• Towering Size: in the Firefight phase you cannot give it a Conceal order — the app locks it to ENGAGE. It cannot be in cover or obscured by Light terrain, terrain parts less than 3" tall, or terrain that isn’t wholly intervening. Whenever ANOTHER operative performs the Shoot action, being within control range of other operatives does not prevent this operative from being selected as a valid target — in other words, it can be shot while within control range of friendly operatives. It can move through terrain parts less than 2" tall, but not through Accessible terrain (excluding hatchways) unless that terrain is also less than 2" tall. Whenever it would finish a move in a terrain feature less than 2" tall, temporarily remove that feature from the killzone and return it when it leaves that location — or, if it is an equipment terrain feature, remove it from the battle instead.\n• It has NO FACTION KEYWORD, so its kill team's faction rules cannot select it.\n• It can perform only the Operate Hatch and Breach mission actions.`,
})
