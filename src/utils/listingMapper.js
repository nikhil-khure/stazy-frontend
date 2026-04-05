export function mapListingToRoom(listing) {
  const images = (listing.media || [])
    .filter(item => item.mediaType === 'IMAGE')
    .map(item => item.url);

  return {
    id: listing.id,
    title: listing.title,
    location: listing.location,
    rent: Number(listing.rentAmount || 0),
    rating: Number(listing.ratingAverage || 0),
    category: mapGenderCategory(listing.genderCategory),
    type: mapRoomKind(listing.roomKind),
    verified: Boolean(listing.verified),
    amenities: listing.amenities || [],
    images: images.length ? images : ['🏠'],
    desc: listing.description || 'No description provided yet.',
    availableCapacity: listing.availableCapacity,
    totalCapacity: listing.totalCapacity,
    status: listing.status,
    fakeDetectionStatus: listing.fakeDetectionStatus,
  };
}

function mapGenderCategory(value) {
  switch ((value || '').toUpperCase()) {
    case 'MALE':
      return 'Male';
    case 'FEMALE':
      return 'Female';
    case 'BOTH':
      return 'Both';
    default:
      return value || 'Both';
  }
}

function mapRoomKind(value) {
  switch ((value || '').toUpperCase()) {
    case 'PG':
      return 'PG';
    case 'HOSTEL':
      return 'Hostel';
    case 'ROOM':
      return 'Room';
    case 'FLAT':
      return 'Flat';
    default:
      return value || 'Room';
  }
}
