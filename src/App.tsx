import React, { useState, useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import './App.css';
import { logoFacebook, logoTwitter, logoLinkedin, logoGoogle, logoInstagram, call, mail, location } from 'ionicons/icons';
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
import PrivateRoute from './pages/PrivateRoute';

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

setupIonicReact();

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        {/* Menú lateral */}
        <IonMenu side="start" menuId="mainMenu" contentId="mainContent">
          <IonHeader>
            <IonToolbar className="custom-toolbar">
              <IonImg
                src="/Habilix.jpg"
                alt="Logo"
                style={{
                  width: '90px',
                  height: 'auto',
                  margin: '10px auto',
                  display: 'block',
                  borderRadius: '10px',
                }}
              />
              <IonTitle style={{ textAlign: 'center', color: '#050530', fontSize: '1.2em' }}>
                Habilix
              </IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent style={{ background: '#CAE9FF' }}> {/* Fondo claro */}
            <IonList lines="none" style={{ padding: '10px' }}>
              {/* Ítem de Inicio */}
              <IonItem
                button
                routerLink={isLoggedIn ? "/Inicio_Usuario" : "/Inicio"}
                className="menu-item"
                style={{
                  margin: '10px 0',
                  borderRadius: '10px',
                  background: '#050530', /* Fondo blanco */
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', /* Sombra suave */
                  transition: 'all 0.3s ease',
                }}
              >
                <IonIcon icon={home} slot="start" style={{ color: '#050530' }} />
                <IonLabel style={{ color: '#050530', fontWeight: '500' }}>{isLoggedIn ? 'Inicio Usuario' : 'Inicio'}</IonLabel>
              </IonItem>

              {/* Ítem de Cursos */}
              <IonItem
                button
                routerLink="/Cursos"
                className="menu-item"
                style={{
                  margin: '10px 0',
                  borderRadius: '10px',
                  background: '#050530', /* Fondo blanco */
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', /* Sombra suave */
                  transition: 'all 0.3s ease',
                }}
              >
                <IonIcon icon={school} slot="start" style={{ color: '#050530' }} />
                <IonLabel style={{ color: '#050530', fontWeight: '500' }}>Cursos</IonLabel>
              </IonItem>

              {/* Ítem de Contactos */}
              <IonItem
                button
                routerLink="/Contactos"
                className="menu-item"
                style={{
                  margin: '10px 0',
                  borderRadius: '10px',
                  background: '#050530', /* Fondo blanco */
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', /* Sombra suave */
                  transition: 'all 0.3s ease',
                }}
              >
                <IonIcon icon={people} slot="start" style={{ color: '#050530' }} />
                <IonLabel style={{ color: '#050530', fontWeight: '500' }}>Contactos</IonLabel>
              </IonItem>

              {/* Ítem de Ayuda */}
              <IonItem
                button
                routerLink="/Ayuda"
                className="menu-item"
                style={{
                  margin: '10px 0',
                  borderRadius: '10px',
                  background: '#050530', /* Fondo blanco */
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', /* Sombra suave */
                  transition: 'all 0.3s ease',
                }}
              >
                <IonIcon icon={helpCircle} slot="start" style={{ color: '#050530' }} />
                <IonLabel style={{ color: '#050530', fontWeight: '500' }}>Ayuda</IonLabel>
              </IonItem>

              {/* Ítem de Registro o Perfil */}
              {!isLoggedIn ? (
                <IonItem
                  button
                  routerLink="/Login"
                  className="menu-item"
                  style={{
                    margin: '10px 0',
                    borderRadius: '10px',
                    background: '#050530', /* Color de acento */
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', /* Sombra suave */
                    transition: 'all 0.3s ease',
                  }}
                >
                  <IonIcon icon={logIn} slot="start" style={{ color: '#050530' }} />
                  <IonLabel style={{ color: '#050530', fontWeight: '500' }}>Registro</IonLabel>
                </IonItem>
              ) : (
                <IonItem
                  button
                  routerLink="/Perfil"
                  className="menu-item"
                  style={{
                    margin: '10px 0',
                    borderRadius: '10px',
                    background: '#050530', /* Color de acento */
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', /* Sombra suave */
                    transition: 'all 0.3s ease',
                  }}
                >
                  <IonIcon icon={personCircle} slot="start" style={{ color: '#FFFFFF' }} />
                  <IonLabel style={{ color: '#FFFFFF', fontWeight: '500' }}>Perfil</IonLabel>
                </IonItem>
              )}
            </IonList>
          </IonContent>
        </IonMenu>

        {/* Contenedor principal */}
        <div className="app-container">
          <IonHeader>
            <IonToolbar color="primary">
              <IonButtons slot="end">
                <IonMenuButton autoHide={false} />
              </IonButtons>
              <IonTitle style={{ textAlign: 'left', flex: 1 }}>Habilix</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent id="mainContent" className="ion-padding">
            <IonRouterOutlet>
              <Route exact path="/Inicio" render={() => (isLoggedIn ? <Redirect to="/Inicio_Usuario" /> : <Inicio />)} />
              <Route exact path="/Cursos" component={Cursos} />
              <Route exact path="/Contactos" component={Contactos} />
              <Route exact path="/Ayuda" component={Ayuda} />
              <Route exact path="/Login" component={Login} />
              <PrivateRoute exact path="/Perfil" component={Perfil} isLoggedIn={isLoggedIn} />
              <PrivateRoute exact path="/Inicio_Usuario" component={InicioUsuario} isLoggedIn={isLoggedIn} />
              <Route exact path="/">
                <Redirect to="/Inicio" />
              </Route>
            </IonRouterOutlet>
          </IonContent>

          <IonFooter className="footer" style={{ padding: '5px 0' }}>
            <IonGrid>
              <IonRow className="footer-content">
                {/* Contacto */}
                <IonCol size="4" className="footer-contact" style={{ fontSize: '12px' }}>
                  <p><IonIcon icon={location} /> Santo Domingo, Repùblica Dominicana</p>
                  <p><IonIcon icon={call} /> (+1) 809 514 9661</p>
                  <p><IonIcon icon={mail} /> habilixcorporation@gmail.com</p>
                </IonCol>

                {/* Redes sociales */}
                <IonCol size="4" className="footer-icons" style={{ fontSize: '14px' }}>
                  <IonIcon icon={logoFacebook} style={{ margin: '0 5px' }} />
                  <IonIcon icon={logoTwitter} style={{ margin: '0 5px' }} />
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