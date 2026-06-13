import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UserMusicComponent } from "../../components/user-music/user-music.component";
import { UserFormComponent } from '../../components/user-form/user-form.component';
import { HeaderComponent } from '../../components/header/header.component';
import { GiftComponent } from "../../components/gift/gift.component";
import { CountdownComponent } from "../../components/countdown/countdown.component";
import { MapsComponent } from "../../components/maps/maps.component";
import { StartComponent } from "../../components/start/start.component";
import { ItineraryComponent } from '../../components/itinerary/itinerary.component';
import { DressCodeComponent } from '../../components/dress-code/dress-code.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UserMusicComponent, UserFormComponent, HeaderComponent, GiftComponent, CountdownComponent, MapsComponent, StartComponent, ItineraryComponent, DressCodeComponent],
})
export default class HomePage {}
