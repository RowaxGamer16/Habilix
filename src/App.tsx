import React, { useState, useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import './App.css';
import { logoFacebook, logoX, chevronForward, logoGoogle, logoInstagram, call, mail, location } from 'ionicons/icons';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonMenu,
  IonMenuButton,
  IonToolbar,
  IonButtons,
  IonButton,
  IonHeader,
  IonContent,
  IonFooter,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonList,
  IonItem,
  IonTitle,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { home, school, people, helpCircle, logIn, personCircle } from 'ionicons/icons';
import Inicio from './pages/Inicio';
import Cursos from './pages/Cursos';
import Contactos from './pages/Contactos';
import Ayuda from './pages/Ayuda';
import Login from './pages/Login';
import Perfil from './pages/Perfil';
import InicioUsuario from './pages/Inicio_Usuario';
import InicioAdmin from './pages/Admin/InicioAdmin';
import GestionUsuarios from './pages/Admin/GestionUsuarios';
import PrivateRoute from './pages/PrivateRoute'; // Asegúrate de importar el PrivateRoute
import { UserProvider } from './context/UserContext'; // Importa el 
import CursoDetalle from './pages/CursoDetalle';

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
import Cursos_Usuario from './pages/Cursos_Usuario';

setupIonicReact();

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token); // Convierte en booleano directo
    console.log("Usuario logueado:", !!token); // Verifica en la consola
  }, []);
  

  return (
    <IonApp>
      <IonReactRouter>
        {/* Menú lateral */}
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
                  width: '70px',  // Reducido de 100px a 70px
                  height: '70px', // Reducido de 100px a 70px
                  margin: '0 auto',
                  display: 'block',
                  borderRadius: '500%',
                  border: '2px solid rgba(255,255,255,0.2)', // Borde más fino
                  boxShadow: '0 3px 10px rgba(0,0,0,0.2)', // Sombra más sutil
                  transition: 'transform 0.3s ease'
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
              {/* Ítems del menú con nuevo diseño */}
              {[
                {
                  icon: home,
                  label: isLoggedIn ? 'Inicio' : 'Inicio',
                  link: isLoggedIn ? "/Inicio_Usuario" : "/Inicio",
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
              ].map((item, index) => (
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
                      fontSize: '1.4rem',
                      transition: 'all 0.3s ease'
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
                    style={{
                      color: '#adb5bd',
                      fontSize: '1rem'
                    }}
                  />
                </IonItem>
              ))}
            </IonList>

            {/* Pie del menú */}
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
                © 2023 Habilix
              </IonText>
            </div>
          </IonContent>
        </IonMenu>

        {/* Contenedor principal */}
        <div className="app-container">
          <IonHeader>
            <IonToolbar color="secondary">
              <IonButtons slot="end">
                <IonMenuButton autoHide={false} />
              </IonButtons>
              <IonTitle style={{ textAlign: 'left', flex: 1, fontFamily: 'Josefin Sans, sans-serif' }}>Habilix</IonTitle>
            </IonToolbar>
          </IonHeader>

          <UserProvider>
            <IonContent id="mainContent" className="ion-padding">
              <IonRouterOutlet>
                <Route exact path="/Inicio" render={() => (isLoggedIn ? <Redirect to="/Inicio_Usuario" /> : <Inicio />)} />
                <Route exact path="/Cursos" component={Cursos} />
                <Route exact path="/Contactos" component={Contactos} />
                <Route exact path="/Ayuda" component={Ayuda} />
                <Route exact path="/Login" component={Login} />
                <Route path="/curso/:id" component={CursoDetalle} exact />
                <Route exact path="/GestionUsuarios" component={GestionUsuarios} />
                <PrivateRoute exact path="/Cursos_Usuarios" component={Cursos_Usuario} isLoggedIn={isLoggedIn} />
                <PrivateRoute exact path="/Perfil" component={Perfil} isLoggedIn={isLoggedIn} />
                <PrivateRoute exact path="/Inicio_Usuario" component={InicioUsuario} isLoggedIn={isLoggedIn} />
                <PrivateRoute exact path="/InicioAdmin" component={InicioAdmin} isLoggedIn={isLoggedIn} />
                <Route exact path="/" render={() => (
                  isLoggedIn ? <Redirect to="/Inicio_Usuario" /> : <Redirect to="/Inicio" />
                )} />
              </IonRouterOutlet>
            </IonContent>
          </UserProvider>

          <IonFooter className="footer" style={{ padding: '5px 0' }}>
            <IonGrid>
              <IonRow className="footer-content">
                {/* Contacto */}
                <IonCol size="4" className="footer-contact" style={{ fontSize: '12px' }}>
                  <p><IonIcon icon={location} style={{ margin: '0 5px' }} /> Santo Domingo, Repùblica Dominicana</p>
                  <p><IonIcon icon={call} style={{ margin: '0 5px' }} /> (+1) 809 514 9661</p>
                  <p><IonIcon icon={mail} style={{ margin: '0 5px' }} /> habilixcorporation@gmail.com</p>
                </IonCol>

                {/* Redes sociales */}
                <IonCol size="4" className="footer-icons" style={{ fontSize: '14px' }}>
                  <IonIcon icon={logoFacebook} style={{ margin: '0 5px' }} />
                  <IonIcon icon={logoX} style={{ margin: '0 5px' }} />
                  <IonIcon icon={logoInstagram} style={{ margin: '0 5px' }} />
                </IonCol>

                {/* Derechos reservados */}
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
