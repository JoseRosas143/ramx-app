'use client'

import dynamic from 'next/dynamic'

const LostPetMap = dynamic(() => import('./lost-pet-map'), {
  ssr: false,
})

export default LostPetMap