import { business } from '@/lib/business';
import { PhoneIcon } from './icons';

export function MobileActionBar() {
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-navy/97 backdrop-blur border-t border-bone/15 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] grid grid-cols-2 gap-2.5">
      <a
        href={business.phoneHref}
        className="flex items-center justify-center gap-2 border border-bone/40 text-bone font-semibold text-sm rounded-md min-h-[48px] px-3"
      >
        <PhoneIcon className="w-4 h-4" />
        Call
      </a>
      <a
        href="#estimate"
        className="shine flex items-center justify-center bg-ochre text-ink font-bold text-sm rounded-md min-h-[48px] px-3"
      >
        Get Estimate
      </a>
    </div>
  );
}
