import React from "react";
import { Box, CircularProgress } from '@material-ui/core';

// TODO why is it so hard to center something?
export const Spinner = ()           => <Box display='flex' justifyContent='center'><CircularProgress color='secondary'/></Box>
export const Message = ({children}) => <Box display='flex' justifyContent='center' m='1'>{children}</Box>

export function getLatLng(){
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async pos => resolve([pos.coords.latitude, pos.coords.longitude]),
      error => reject(error),
      {
        enableHighAccuracy: true
      }
    )
  })
}