import { Injectable } from '@angular/core';
import { BumpType } from '../../electron/enums';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  constructor() { }

  bump_type = BumpType.Patch

}
