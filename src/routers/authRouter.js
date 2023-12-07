import jwt from 'jsonwebtoken';
import { Router } from 'express';
import passport from 'passport';
import config from '../config.js';
import responseHelper from '../helpers/response.js';
import authService from '../services/authService.js';
import { ValidationError, AuthenticationError } from '../helpers/customError.js';
// import authTokenService from '../../commons/services/authTokenService';

// import axiosUtils from '../../helpers/axiosUtils';
// import customerOAuthService from '../services/customerOAuthService';
// import userLoginActivityService from '../services/userLoginActivityService';

const router = Router();
// const OAuth2Strategy = require('passport-oauth2');

// const allOAuthClients = customerOAuthService.getAllOauthUrls();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

// deserialize the cookieUserId to user in the database
passport.deserializeUser((id, done) => {
  const User = authService.getUserByEmail(id);
  if (User) {
    done(null, User);
  }
});
// const isValidPassword = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,255}$/;

// allOAuthClients.then(ret => ret.forEach(setting => {
//   const authSetting = {
//     settings: {
//       authorizationURL: setting.authorizationUrl,
//       tokenURL: setting.tokenUrl,
//       clientID: setting.clientID,
//       clientSecret: setting.clientSecret,
//       callbackURL: setting.callbackUrl,
//       scope: setting.scope,
//     },
//     profileMapping: setting.profileMapping,
//     compName: setting.subDomainIdentifier,
//     authUrlName: setting.authUrlName,
//     userInfo: setting.userInfoUrl,
//   };
//   passport.use(authSetting.authUrlName, new OAuth2Strategy(authSetting.settings,
//     async (accessToken, refreshToken, profile, cb) => {
//       const dataConfiguration = {
//         method: 'get',
//         url: authSetting.userInfo,
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           'Content-Type': 'accessToken',
//         },
//       };
//       const userInfo = await axiosUtils.getResponse(dataConfiguration);
//       const User = await authService.getUserByEmail(userInfo[authSetting.profileMapping.email]);
//       if (User) {
//         return cb(null, User);
//       }
//       return cb(null, User);
//     }));

//   router.get(`/${authSetting.authUrlName}`,
//     passport.authenticate(authSetting.authUrlName));

//   router.get(`/${authSetting.authUrlName}/callback`,
//     passport.authenticate(authSetting.authUrlName, { failureRedirect: `${config.app.capp.url}/login?error='No user exists'`, session: false }),
//     async (req, res, next) => {
//       const { user } = req;
//       const values = user;
//       values.ipAddress = req.clientIp;
//       return authService.login(values, true)
//         .then(ret => {
//           if (ret.data.auth) {
//             res.cookie(config.app.capp.auth.token, ret.data.token, {
//               maxAge: 10 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true, sameSite: 'strict', domain: config.app.capp.auth.domain, path: '/',
//             });
//           } else {
//             throw new AuthenticationError();
//           }
//           res.redirect(config.app.capp.url);
//         }).catch(err => next(err));
//     });
// }));

// router.get('/register/:registrationToken', (req, res, next) => {
//   const { registrationToken } = req.params;
//   return authService.getRegistrationData(registrationToken)
//     .then(ret => responseHelper.success(res, ret))
//     .catch(err => next(err));
// });

// router.post('/register/:registrationToken', (req, res, next) => {
//   const { registrationToken } = req.params;
//   const values = req.body;
//   if (!values.password.match(isValidPassword)) {
//     throw new ValidationError('Enter a valid password(One Numeric Value ,One Special Character, One Uppercase & One Lowercase Character)');
//   } else {
//     values.ipAddress = req.clientIp;
//     return authService.register(values, registrationToken)
//       .then(ret => {
//         if (ret.auth) {
//           res.cookie(config.app.capp.auth.token, ret.token, {
//             maxAge: 10 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true, sameSite: 'strict', domain: config.app.capp.auth.domain, path: '/',
//           });
//         } else {
//           throw new AuthenticationError();
//         }
//         return responseHelper.success(res, ret);
//       })
//       .catch(err => next(err));
//   }
// });

router.post('/login', (req, res, next) => {
  const values = req.body;
  console.log('jhgfdsddsdsdsdsd3333333', values)
  values.ipAddress = req.clientIp;
  let byPassAuth = false;
  if (values.byPassAuth) {
    byPassAuth = values.byPassAuth;
  }
  return authService.login(values, byPassAuth)
    .then(ret => {
      if (ret.data.auth) {
        res.cookie(config.app.capp.auth.token, ret.data.token, {
          maxAge: 10 * 24 * 60 * 60 * 1000, httpOnly: true, secure: true, sameSite: 'strict', domain: config.app.capp.auth.domain, path: '/',
        });
      } else {
        throw new AuthenticationError();
      }
      return responseHelper.success(res, ret.data, ret.meta);
    }).catch(err => next(err));
});

// router.post('/update-password', (req, res, next) => {
//   const values = req.body;
//   const str = req.body.newPassword;
//   if (!str.match(isValidPassword)) {
//     throw new ValidationError('Enter a valid password(One Numeric Value ,One Special Character, One Uppercase & One Lowercase Character)');
//   }
//   return authService.updatePassword(values)
//     .then(ret => responseHelper.success(res, ret))
//     .catch(err => next(err));
// });

// router.post('/forgot-password', (req, res, next) => {
//   const values = req.body;
//   return authService.forgotPassword(values)
//     .then(ret => responseHelper.success(res, ret))
//     .catch(err => next(err));
// });

// router.get('/reset-password/:resetToken', (req, res, next) => {
//   const { resetToken } = req.params;
//   return authService.getResetData(resetToken)
//     .then(ret => responseHelper.success(res, ret))
//     .catch(err => next(err));
// });

// router.post('/reset-password/:resetToken', (req, res, next) => {
//   const { resetToken } = req.params;
//   const values = req.body;
//   return authService.resetPassword(values, resetToken)
//     .then(() => responseHelper.success(res))
//     .catch(err => next(err));
// });

// router.post('/logout', authService.authenticate, async (req, res) => {
//   res.clearCookie('session');
//   const token = req.cookies[config.app.capp.auth.token];
//   jwt.verify(token, config.app.capp.auth.jwtSecret, async (err, decoded) => {
//     await authTokenService.markTokenInactive(decoded.key);
//   });
//   await userLoginActivityService.createLogoutEvent(req.appAuth);
//   res.clearCookie(config.app.capp.auth.token, {
//     httpOnly: true, secure: true, sameSite: 'strict', domain: config.app.capp.auth.domain, path: '/',
//   });
//   return responseHelper.success(res);
// });

// router.get('/oauthLoginUrl/:subDomain', (req, res, next) => {
//   const { subDomain } = req.params;
//   return customerOAuthService.getOauthUrlsForCustomer(subDomain)
//     .then(ret => responseHelper.success(res, ret))
//     .catch(err => next(err));
// });

export default router;
