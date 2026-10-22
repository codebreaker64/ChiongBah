import { LAST_UPDATED, TERMS } from '@/content/legal';
import { DocScreen } from '@/ui/DocScreen';

export default function Terms() {
  return <DocScreen intro={`Last updated ${LAST_UPDATED}`} sections={TERMS} />;
}
