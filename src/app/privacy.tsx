import { LAST_UPDATED, PRIVACY } from '@/content/legal';
import { DocScreen } from '@/ui/DocScreen';

export default function Privacy() {
  return <DocScreen intro={`Last updated ${LAST_UPDATED}`} sections={PRIVACY} />;
}
