import { Injectable } from '@angular/core';
import { BumpType } from '../constants/enums';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  constructor() { }

  bump_type = BumpType.Patch

}
