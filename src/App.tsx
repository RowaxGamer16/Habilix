import React, { useState, useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { 
  IonApp, IonIcon, IonLabel, IonRouterOutlet, IonMenu, IonMenuButton, 
  IonToolbar, IonButtons, IonButton, IonHeader, IonContent, IonFooter, 
  IonText, IonGrid, IonRow, IonCol, IonImg, IonList, IonItem, IonTitle 
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { 
  home, school, people, helpCircle, logIn, personCircle, 
  logoFacebook, logoX, chevronForward, logoGoogle, logoInstagram, 
  call, mail, location, settings 
} from 'ionicons/icons';
import { setupIonicReact } from '@ionic/react';

// Pages
import Inicio from './pages/Inicio';
import Cursos from './pages/Cursos';
import Contactos from './pages/Contactos';
import Ayuda from './pages/Ayuda';
import Login from './pages/Login';
import Perfil from './pages/Perfil';
import InicioUsuario from './pages/Inicio_Usuario';
import InicioAdmin from './pages/InicioAdmin';
import GestionUsuarios from './pages/GestionUsuarios';
import CursoDetalle from './pages/CursoDetalle';
import Cursos_Usuario from './pages/Cursos_Usuario';
import PrivateRoute from './pages/PrivateRoute';
import { UserProvider } from './context/UserContext';
import EditarPerfil from './pages/EditarPerfil';

// CSS
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './App.css';

setupIonicReact();

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    setIsLoggedIn(!!token);
    setIsAdmin(adminStatus);
  }, []);

  const getMenuItems = () => [
    {
      icon: home,
      label: 'Inicio',
      link: isLoggedIn ? (isAdmin ? "/InicioAdmin" : "/Inicio_Usuario") : "/Inicio",
      color: '#4a00e0'
    },
    {
      icon: school,
      label: 'Cursos',
      link: "/Cursos",
      color: '#6a3093'
    },
    {
      icon: people,
      label: 'Contactos',
      link: "/Contactos",
      color: '#8e2de2'
    },
    {
      icon: helpCircle,
      label: 'Ayuda',
      link: "/Ayuda",
      color: '#4776E6'
    },
    {
      icon: isLoggedIn ? personCircle : logIn,
      label: isLoggedIn ? 'Perfil' : 'Login',
      link: isLoggedIn ? "/Perfil" : "/Login",
      color: isLoggedIn ? '#00b09b' : '#1FA2FF'
    }
  ];

  return (
    <IonApp>
      <IonReactRouter>
        {/* Side Menu */}
        <IonMenu side="start" menuId="mainMenu" contentId="mainContent">
          <IonHeader>
            <IonToolbar className="custom-toolbar" style={{
              background: 'linear-gradient(135deg, #050530 0%, #1a1a6e 100%)',
              padding: '20px 0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
              <IonImg
                src="/Habilix.jpg"
                alt="Logo"
                style={{
                  width: '70px',
                  height: '70px',
                  margin: '0 auto',
                  display: 'block',
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.2)'
                }}
              />
              <IonText style={{
                display: 'block',
                textAlign: 'center',
                color: 'white',
                marginTop: '10px',
                fontSize: '1.2rem',
                fontWeight: '600',
                fontFamily: 'Josefin Sans, sans-serif'
              }}>
                Habilix
              </IonText>
            </IonToolbar>
          </IonHeader>

          <IonContent style={{
            background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
            fontFamily: 'Josefin Sans, sans-serif'
          }}>
            <IonList lines="none" style={{ padding: '15px' }}>
              {getMenuItems().map((item, index) => (
                <IonItem
                  key={index}
                  button
                  routerLink={item.link}
                  className="menu-item"
                  style={{
                    margin: '12px 0',
                    borderRadius: '12px',
                    background: 'white',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    '--background-hover': '#f1f1f1',
                    '--background-activated': '#e9ecef',
                    borderLeft: `5px solid ${item.color}`
                  }}
                >
                  <IonIcon
                    icon={item.icon}
                    slot="start"
                    style={{
                      color: item.color,
                      fontSize: '1.4rem'
                    }}
                  />
                  <IonLabel style={{
                    color: '#343a40',
                    fontWeight: '600',
                    fontFamily: 'Josefin Sans, sans-serif',
                    letterSpacing: '0.5px'
                  }}>
                    {item.label}
                  </IonLabel>
                  <IonIcon
                    icon={chevronForward}
                    slot="end"
                    style={{ color: '#adb5bd', fontSize: '1rem' }}
                  />
                </IonItem>
              ))}
            </IonList>

            <div style={{
              padding: '20px',
              textAlign: 'center',
              marginTop: 'auto',
              borderTop: '1px solid #dee2e6'
            }}>
              <IonText style={{
                color: '#6c757d',
                fontSize: '0.8rem',
                fontFamily: 'Josefin Sans, sans-serif'
              }}>
                © 2025 Habilix
              </IonText>
            </div>
          </IonContent>
        </IonMenu>

        {/* Main Content */}
        <div className="app-container">
          <IonHeader>
            <IonToolbar color="secondary">
              <IonButtons slot="end">
                <IonMenuButton autoHide={false} />
              </IonButtons>
              <IonTitle style={{ textAlign: 'left', flex: 1, fontFamily: 'Josefin Sans, sans-serif' }}>
                Habilix
              </IonTitle>
            </IonToolbar>
          </IonHeader>

          <UserProvider>
            <IonContent id="mainContent" className="ion-padding">
              <IonRouterOutlet>
                {/* Public Routes */}
                <Route exact path="/Inicio" render={() => (
                  isLoggedIn ? 
                    (isAdmin ? <Redirect to="/InicioAdmin" /> : <Redirect to="/Inicio_Usuario" />) 
                    : <Inicio />
                )} />
                <Route exact path="/Cursos" component={Cursos} />
                <Route exact path="/Contactos" component={Contactos} />
                <Route exact path="/Ayuda" component={Ayuda} />
                <Route exact path="/Login" component={Login} />
                <Route path="/curso/:id" component={CursoDetalle} exact />
                <Route exact path="/EditarPerfil" component={EditarPerfil} />

                {/* Private Routes */}
                <PrivateRoute exact path="/Cursos_Usuario" component={Cursos_Usuario} />
                <PrivateRoute exact path="/Perfil" component={Perfil} />
                <PrivateRoute exact path="/Inicio_Usuario" component={InicioUsuario} />
                <PrivateRoute exact path="/InicioAdmin" component={InicioAdmin} />
                <PrivateRoute exact path="/GestionUsuarios" component={GestionUsuarios} />
                
                {/* Default Route */}
                <Route exact path="/" render={() => (
                  isLoggedIn ? 
                    (isAdmin ? <Redirect to="/InicioAdmin" /> : <Redirect to="/Inicio_Usuario" />) 
                    : <Redirect to="/Inicio" />
                )} />
              </IonRouterOutlet>
            </IonContent>
          </UserProvider>

          <IonFooter className="footer" style={{ padding: '5px 0' }}>
            <IonGrid>
              <IonRow className="footer-content">
                <IonCol size="4" className="footer-contact" style={{ fontSize: '12px' }}>
                  <p><IonIcon icon={location} style={{ margin: '0 5px' }} /> Santo Domingo, República Dominicana</p>
                  <p><IonIcon icon={call} style={{ margin: '0 5px' }} /> (+1) 809 514 9661</p>
                  <p><IonIcon icon={mail} style={{ margin: '0 5px' }} /> habilixcorporation@gmail.com</p>
                </IonCol>

                <IonCol size="4" className="footer-icons" style={{ fontSize: '14px' }}>
                  <IonIcon icon={logoFacebook} style={{ margin: '0 5px' }} />
                  <IonIcon icon={logoX} style={{ margin: '0 5px' }} />
                  <IonIcon icon={logoInstagram} style={{ margin: '0 5px' }} />
                </IonCol>

                <IonCol size="4" className="footer-text" style={{ fontSize: '12px' }}>
                  <IonText>Habilix &copy; 2025</IonText>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonFooter>
        </div>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;