import React, { useState, useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import './App.css';
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
            <IonToolbar>
              <IonImg src="/Habilix.jpg" alt="Logo" style={{ width: '90px', height: 'auto', margin: '10px' }} />
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonList>
              <IonItem button routerLink={isLoggedIn ? "/Inicio_Usuario" : "/Inicio"}>
                <IonIcon icon={home} slot="start" />
                <IonLabel>{isLoggedIn ? 'Inicio Usuario' : 'Inicio'}</IonLabel>
              </IonItem>
              <IonItem button routerLink="/Cursos">
                <IonIcon icon={school} slot="start" />
                <IonLabel>Cursos</IonLabel>
              </IonItem>
              <IonItem button routerLink="/Contactos">
                <IonIcon icon={people} slot="start" />
                <IonLabel>Contactos</IonLabel>
              </IonItem>
              <IonItem button routerLink="/Ayuda">
                <IonIcon icon={helpCircle} slot="start" />
                <IonLabel>Ayuda</IonLabel>
              </IonItem>
              {!isLoggedIn ? (
                <IonItem button routerLink="/Login">
                  <IonIcon icon={logIn} slot="start" />
                  <IonLabel>Registro</IonLabel>
                </IonItem>
              ) : (
                <IonItem button routerLink="/Perfil">
                  <IonIcon icon={personCircle} slot="start" />
                  <IonLabel>Perfil</IonLabel>
                </IonItem>
              )}
            </IonList>
          </IonContent>
        </IonMenu>

        {/* Contenedor principal */}
        <div className="app-container">
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="end"> {/* Coloca el menú hamburguesa a la derecha */}
                <IonMenuButton autoHide={false} />
              </IonButtons>
              <IonTitle style={{ textAlign: 'left', flex: 1 }}>Habilix</IonTitle> {/* Alinear Habilix a la izquierda */}
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

          <IonFooter>
            <IonToolbar>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" size-md="4" className="ion-text-start">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <IonImg src="/Habilix.jpg" alt="Logo Habilix" style={{ width: '60px', height: 'auto', marginRight: '10px' }} />
                      <IonText>
                        <h4>Habilix</h4>
                      </IonText>
                    </div>
                  </IonCol>
                  <IonCol size="12" size-md="4" className="ion-text-center">
                    <IonText color="medium">© 2025 Derechos reservados.</IonText>
                  </IonCol>
                  <IonCol size="12" size-md="4" className="ion-text-end">
                    <IonText>Redes Sociales:</IonText>
                    <IonButton href="https://facebook.com" fill="clear">
                      <IonImg src="/Facebook.png" alt="Facebook" style={{ width: '24px' }} />
                    </IonButton>
                    <IonButton href="https://instagram.com" fill="clear">
                      <IonImg src="/Instagram.jpeg" alt="Instagram" style={{ width: '24px' }} />
                    </IonButton>
                    <IonButton href="https://twitter.com" fill="clear">
                      <IonImg src="/Twitter.jpeg" alt="Twitter" style={{ width: '24px' }} />
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonToolbar>
          </IonFooter>
        </div>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;