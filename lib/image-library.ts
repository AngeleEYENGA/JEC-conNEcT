export type JecPhoto = {
  src: string;
  photographer: string;
  source: string;
  sourceUrl: string;
  licenseUrl: string;
  altFr: string;
  altEn: string;
  captionFr: string;
  captionEn: string;
  aspect: "landscape" | "portrait";
};

const pexelsLicense = "https://www.pexels.com/license/";

export const jecPhotos = {
  community: {
    src: "https://images.pexels.com/photos/9433169/pexels-photo-9433169.jpeg?cs=srgb&dl=pexels-gabby-k-9433169.jpg&fm=jpg",
    photographer: "Monstera Production",
    source: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/group-of-people-doing-work-together-9433169/",
    licenseUrl: pexelsLicense,
    altFr: "Un groupe de jeunes échange autour d'un ordinateur et de documents",
    altEn: "A group of young people sharing ideas around a laptop and documents",
    captionFr: "Photo d’illustration · Monstera Production / Pexels",
    captionEn: "Illustrative photo · Monstera Production / Pexels",
    aspect: "landscape"
  },
  peerStudy: {
    src: "https://images.pexels.com/photos/5965540/pexels-photo-5965540.jpeg?cs=srgb&dl=pexels-charlotte-may-5965540.jpg&fm=jpg",
    photographer: "Charlotte May",
    source: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/positive-multiethnic-students-working-together-5965540/",
    licenseUrl: pexelsLicense,
    altFr: "Deux étudiantes travaillent ensemble sur un ordinateur sur un campus",
    altEn: "Two students working together on a laptop on campus",
    captionFr: "Photo d’illustration · Charlotte May / Pexels",
    captionEn: "Illustrative photo · Charlotte May / Pexels",
    aspect: "landscape"
  },
  studentTeam: {
    src: "https://images.pexels.com/photos/6140697/pexels-photo-6140697.jpeg?cs=srgb&dl=pexels-william-fortunato-6140697.jpg&fm=jpg",
    photographer: "William Fortunato",
    source: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/positive-multiethnic-students-working-together-on-laptops-6140697/",
    licenseUrl: pexelsLicense,
    altFr: "Trois jeunes adultes de différentes origines collaborent sur des ordinateurs",
    altEn: "Three young adults from different backgrounds collaborating on laptops",
    captionFr: "Photo d’illustration · William Fortunato / Pexels",
    captionEn: "Illustrative photo · William Fortunato / Pexels",
    aspect: "landscape"
  },
  library: {
    src: "https://images.pexels.com/photos/5940844/pexels-photo-5940844.jpeg?cs=srgb&dl=pexels-kampus-5940844.jpg&fm=jpg",
    photographer: "Kampus Production",
    source: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/multiethnic-students-doing-research-together-in-library-5940844/",
    licenseUrl: pexelsLicense,
    altFr: "Un petit groupe d'étudiants échange dans une bibliothèque universitaire",
    altEn: "A small group of students sharing ideas in a university library",
    captionFr: "Photo d’illustration · Kampus Production / Pexels",
    captionEn: "Illustrative photo · Kampus Production / Pexels",
    aspect: "landscape"
  },
  studyGroup: {
    src: "https://images.pexels.com/photos/6684552/pexels-photo-6684552.jpeg?cs=srgb&dl=pexels-andy-barbour-6684552.jpg&fm=jpg",
    photographer: "Andy Barbour",
    source: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/group-of-students-working-together-6684552/",
    licenseUrl: pexelsLicense,
    altFr: "Des étudiants de différentes origines travaillent ensemble autour d'une table",
    altEn: "Students from different backgrounds working together around a table",
    captionFr: "Photo d’illustration · Andy Barbour / Pexels",
    captionEn: "Illustrative photo · Andy Barbour / Pexels",
    aspect: "landscape"
  },
  africanClassroom: {
    src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Students_in_classroom.jpg/1920px-Students_in_classroom.jpg",
    photographer: "Esthee2010",
    source: "Wikimedia Commons",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Students_in_classroom.jpg",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    altFr: "Une classe d'élèves participe à un cours dans une salle de classe",
    altEn: "A classroom of students taking part in a lesson",
    captionFr: "CC BY-SA 4.0 · Esthee2010 / Wikimedia Commons",
    captionEn: "CC BY-SA 4.0 · Esthee2010 / Wikimedia Commons",
    aspect: "landscape"
  }
} satisfies Record<string, JecPhoto>;

export const projectPhotos = [jecPhotos.studentTeam, jecPhotos.studyGroup, jecPhotos.community, jecPhotos.peerStudy];
export const workspacePhotos = {
  national_team: jecPhotos.community,
  federation: jecPhotos.studentTeam,
  local_team: jecPhotos.peerStudy,
  commission: jecPhotos.library,
  service: jecPhotos.studyGroup,
  project: jecPhotos.studentTeam,
  temporary_group: jecPhotos.community
} as const;
