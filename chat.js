console.log("Let the Music Begin");

// Initialize
let songIndex = 0;
let audioElement = new Audio();
let masterPlay = document.getElementById("masterPlay");
let myProgressBar = document.getElementById("myProgressBar");
let gif = document.getElementById("gif");
let masterSongName = document.getElementById("masterSongName");
let songItemContainer = document.querySelector(".songItemContainer");
let currentSong = document.getElementById("currentSong");

let songs = [
  { songName: "Perfect", filepath: "songs/Ed-Sheeran.mp3", coverPath: "covers/cover.jpg" },
  { songName: "Hymn For The Weekend", filepath: "songs/Coldplay - Hymn For The Weekend.mp3", coverPath: "covers/hmm.jpeg" },
  { songName: "Dancing With Your Ghost", filepath: "songs/Dancing With Your Ghost.mp3", coverPath: "covers/ghost.jpg" },
  { songName: "Heat Waves", filepath: "songs/Glass Animals - Heat Waves.mp3", coverPath: "covers/heatwave.jpg" },
  { songName: "Happier", filepath: "songs/happier.mp3", coverPath: "covers/happier.jpeg" },
  { songName: "Imagine Dragons", filepath: "songs/Imagine Dragons.mp3", coverPath: "covers/enemy.jpeg" },
  { songName: "Willow", filepath: "songs/willow.mp3", coverPath: "covers/willow.jpg" },
  { songName: "Believer", filepath: "songs/Imagine Dragons - Believer.mp3", coverPath: "covers/noThumbnail.jpg" },
];

// Function to create song items
function createSongItem(song, index) {
  return `
    <div class="songItem" onclick="setSongData(${index})">
      <img src="${song.coverPath}" alt="${index + 1}">
      <span class="songName">${song.songName}</span>
      <span class="songlistplay"><span class="timestamp">05:34 <i id="${index}" class="far songItemPlay fa-play-circle"></i></span></span>
    </div>
  `;
}

// Append song items to container
songItemContainer.innerHTML = songs.map((song, index) => createSongItem(song, index)).join("");

// Set initial song data
function setSongData(index) {
  songIndex = index;
  audioElement.src = songs[index].filepath;
  masterSongName.innerText = songs[index].songName;
  currentSong.innerText = songs[index].songName;
  audioElement.currentTime = 0;
  audioElement.play();
  masterPlay.classList.remove("fa-play-circle");
  masterPlay.classList.add("fa-pause-circle");
  gif.style.opacity = 1;
}

// Handle play/pause click
masterPlay.addEventListener("click", () => {
  if (audioElement.paused || audioElement.currentTime <= 0) {
    audioElement.play();
    masterPlay.classList.remove("fa-play-circle");
    masterPlay.classList.add("fa-pause-circle");
    gif.style.opacity = 1;
  } else {
    audioElement.pause();
    masterPlay.classList.remove("fa-pause-circle");
    masterPlay.classList.add("fa-play-circle");
    gif.style.opacity = 0;
  }
});

// Listen to timeupdate event
audioElement.addEventListener("timeupdate", () => {
  const progress = (audioElement.currentTime / audioElement.duration) * 100;
  myProgressBar.value = progress;
});

// Handle progress bar change
myProgressBar.addEventListener("input", () => {
  audioElement.currentTime = (myProgressBar.value / 100) * audioElement.duration;
});

document.getElementById("next").addEventListener("click", () => {
  if (songIndex >= songs.length - 1) {
    songIndex = 0;
  } else {
    songIndex += 1;
  }
  setSongData(songIndex);
});

document.getElementById("previous").addEventListener("click", () => {
  if (songIndex <= 0) {
    songIndex = songs.length - 1;
  } else {
    songIndex -= 1;
  }
  setSongData(songIndex);
});

// Initialize with the first song
setSongData(songIndex);

