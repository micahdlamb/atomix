import React from 'react';
import * as model from 'model'
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { useSnackbar } from 'notistack';

const useStyles = makeStyles({
  card: {
      
  },
  media: {

  },
  h: {
      display: 'flex',
      justifyContent: 'space-between'
  },
  tracks: {
    '& span': {
        display: 'inline-block',
        padding: '2px',
        margin: '2px',
        borderRadius: '5px',
        backgroundColor: '#EEE'
    }
  },
  totalTracks: {
      textAlign:  'center',
      fontStyle: 'italic',
      marginTop: '5px',
  }
});

export default function MatchCard({match}) {
    const classes = useStyles();
    const { enqueueSnackbar } = useSnackbar();

    async function createPlaylistWithUser(){
        let url = await model.createPlaylistWithUser(match.user.id)
        window.location = url
    }

    async function troll(){
        let track_uri = prompt("Enter track URI")
        if (!track_uri) return
        if (track_uri.includes("https://open.spotify.com")){
            let url = new URL(track_uri)
            track_uri = url.pathname.replace("/track/", "")
        }
            
        let result = await model.play_track(match.user.id, track_uri)
        let variant = result === 'success' ? result : 'error'
        enqueueSnackbar(result, {variant})
    }

    return (
        <Card className={classes.card}>
            {match.user.image &&
                <CardMedia
                    component={'img'}
                    className={classes.media}
                    image={match.user.image}
                />
            }
            <CardContent>
                <Typography gutterBottom variant="h5" component="h2" className={classes.h}>
                    <span>{match.user.display_name}</span>
                    <span className={classes.score}>{Math.round(match.score)}</span>
                </Typography>
                <Typography variant="body2" color="textSecondary" component="div" className={classes.tracks}>
                    {match.tracks.slice(0, 5).map(track =>
                        <span key={track.id}>{track.name}</span>
                    )}
                    {match.tracks.length > 10 && ' ...'}
                    <div className={classes.totalTracks}>{match.tracks.length} common tracks</div>
                </Typography>
            </CardContent>
            <CardActions>
                <Button size="small" color="primary" onClick={createPlaylistWithUser}>
                    Open Playlist
                </Button>
                <Button size="small" color="secondary" onClick={troll}>
                    Troll
                </Button>
            </CardActions>
        </Card>
    );
}