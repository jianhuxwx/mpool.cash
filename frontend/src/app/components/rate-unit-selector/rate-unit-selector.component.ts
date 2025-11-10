import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { StorageService } from '@app/services/storage.service';
import { StateService } from '@app/services/state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-rate-unit-selector',
  templateUrl: './rate-unit-selector.component.html',
  styleUrls: ['./rate-unit-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RateUnitSelectorComponent implements OnInit, OnDestroy {
  rateUnitForm: UntypedFormGroup;
  rateUnitSub: Subscription;
  units: { name: string; label: string }[];

  constructor(
    private formBuilder: UntypedFormBuilder,
    private stateService: StateService,
    private storageService: StorageService,
  ) {
    const primaryUnit = this.stateService.env.FEE_RATE_UNIT_MAIN || 'sat/vB';
    const secondaryUnit = this.stateService.env.FEE_RATE_UNIT_SECONDARY;
    this.units = [
      { name: 'vb', label: primaryUnit },
      ...(secondaryUnit ? [{ name: 'wu', label: secondaryUnit }] : []),
    ];
  }

  ngOnInit() {
    this.rateUnitForm = this.formBuilder.group({
      rateUnits: ['vb']
    });
    this.rateUnitSub = this.stateService.rateUnits$.subscribe((units) => {
      this.rateUnitForm.get('rateUnits')?.setValue(units);
    });
  }

  changeUnits() {
    const newUnits = this.rateUnitForm.get('rateUnits')?.value;
    this.storageService.setValue('rate-unit-preference', newUnits);
    this.stateService.rateUnits$.next(newUnits);
  }

  ngOnDestroy(): void {
    this.rateUnitSub.unsubscribe();
  }
}
