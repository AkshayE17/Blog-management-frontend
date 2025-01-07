import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { HomeComponent } from './components/home/home.component';
import { OtpVerifyComponent } from './components/otp-verify/otp-verify.component';
import { VerificationSuccessComponent } from './components/verification-success/verification-success.component';
import { DetailsComponent } from './components/details/details.component';
import { MyblogsComponent } from './components/myblogs/myblogs.component';
import { BlogDetailComponent } from './components/blog-detail/blog-detail.component';

export const routes: Routes = [

  {path:'',component: HomeComponent},
  {path: 'login', component: LoginComponent},
  {path: 'signup', component: RegisterComponent},
  {path: 'otp-verify/:email', component: OtpVerifyComponent},
  {path: 'otpSuccess', component: VerificationSuccessComponent},
  {path: 'details', component: DetailsComponent},
  { path: 'blog/:id', component: BlogDetailComponent }
];
 