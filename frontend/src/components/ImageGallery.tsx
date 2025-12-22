type Props = {
  images: string[]
  title?: string
}

const ImageGallery = ({ images, title }: Props) => {
  if (!images.length) {
    return (
      <div className="gallery__empty">Няма качени изображения за момента.</div>
    )
  }
  return (
    <section className="gallery">
      {title && <h4>{title}</h4>}
      <div className="gallery__grid">
        {images.map((image, idx) => (
          <figure key={image + idx}>
            <img src={image} alt={`Галерия ${idx + 1}`} />
          </figure>
        ))}
      </div>
    </section>
  )
}

export default ImageGallery

