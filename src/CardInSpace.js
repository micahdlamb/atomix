import React from "react";
import Header from "components/Header/Header.js";
import HeaderLinks from "components/Header/HeaderLinks.js";
// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
// import Footer from "components/Footer/Footer.js";
import { makeStyles } from "@material-ui/core/styles";
import { container } from "assets/jss/material-kit-react.js";
import image from "assets/img/bg7.jpg";
import CustomTabs from "components/CustomTabs/CustomTabs.js";

const styles = {
  container: {
    ...container,
    zIndex: "2",
    position: "relative",
    paddingTop: "20vh",
    color: "#FFFFFF",
    paddingBottom: "200px"
  },
  cardHidden: {
    opacity: "0",
    transform: "translate3d(0, -60px, 0)"
  },
  header: {
    minHeight: "100vh",
    height: "auto",
    display: "inherit",
    position: "relative",
    margin: "0",
    padding: "0",
    border: "0",
    alignItems: "center",
    "&:before": {
      background: "rgba(0, 0, 0, 0.5)"
    },
    "&:before,&:after": {
      position: "absolute",
      zIndex: "1",
      width: "100%",
      height: "100%",
      display: "block",
      left: "0",
      top: "0",
      content: '""'
    },
    "& footer li a,& footer li a:hover,& footer li a:active": {
      color: "#FFFFFF"
    },
    "& footer": {
      position: "absolute",
      bottom: "0",
      width: "100%"
    }
  },
};

const useStyles = makeStyles(styles);

const dashboardRoutes = [];

export default function DefaultLayout({tabs, ...rest}) {
  const classes = useStyles();

  const [cardAnimaton, setCardAnimation] = React.useState("cardHidden");
  setTimeout(function() {
    setCardAnimation("");
  }, 700);

  return (
    <div {...rest}>
      <Header
        color="transparent"
        routes={dashboardRoutes}
        brand="Spotify Intersection App"
        rightLinks={<HeaderLinks />}
        fixed
        changeColorOnScroll={{
          height: 400,
          color: "white"
        }}
        {...rest}
      />
      <div
        className={classes.header}
        style={{
          backgroundImage: "url(" + image + ")",
          backgroundSize: "cover",
          backgroundPosition: "top center"
        }}
      >
        <div className={classes.container}>
          <GridContainer justify="center">
            {/* TODO Grid breakpoints don't match page breakpoints which causes jumpiness when resizing */}
            <GridItem lg={8}>
              <CustomTabs
                className={classes[cardAnimaton]}
                headerColor="primary"
                tabs={tabs}
              />
            </GridItem>
          </GridContainer>
        </div>
      </div>
    </div>
  );
}