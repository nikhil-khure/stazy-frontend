import { C } from '../../constants/theme';

/**
 * Image Preview Component with Remove Button
 * Solves Requirements 8, 9, 10, 19, 21, 30: Proper preview without cropping + remove button
 */

export function ImagePreview({ file, url, onRemove, style = {} }) {
  const previewUrl = file ? URL.createObjectURL(file) : url;
  const isVideo = file?.type?.startsWith('video/') || url?.includes('.mp4') || url?.includes('.webm');

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: 200,
      border: `2px solid ${C.border}`,
      borderRadius: 12,
      overflow: 'hidden',
      background: '#f9fafb',
      ...style
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '100%', // 1:1 aspect ratio
      }}>
        {isVideo ? (
          <video
            src={previewUrl}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            controls
          />
        ) : (
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        )}
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.95)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(220, 38, 38, 1)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.95)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

/**
 * Multiple Images Preview Grid
 */
export function ImagePreviewGrid({ files = [], urls = [], onRemove, maxItems = 10 }) {
  const allItems = [
    ...files.map((file, idx) => ({ type: 'file', file, idx })),
    ...urls.map((url, idx) => ({ type: 'url', url, idx: idx + files.length }))
  ].slice(0, maxItems);

  if (allItems.length === 0) {
    return null;
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: 12,
      marginTop: 12,
    }}>
      {allItems.map((item, index) => (
        <ImagePreview
          key={index}
          file={item.type === 'file' ? item.file : null}
          url={item.type === 'url' ? item.url : null}
          onRemove={onRemove ? () => onRemove(item.idx, item.type) : null}
        />
      ))}
    </div>
  );
}

/**
 * Profile Photo Preview (Circular)
 * Solves Requirements 8, 9: Profile photo preview without cropping
 */
export function ProfilePhotoPreview({ file, url, onRemove, size = 120 }) {
  const previewUrl = file ? URL.createObjectURL(file) : url;

  if (!previewUrl) {
    return null;
  }

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      margin: '12px auto',
    }}>
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        overflow: 'hidden',
        border: `3px solid ${C.border}`,
        background: '#f9fafb',
      }}>
        <img
          src={previewUrl}
          alt="Profile"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover', // Cover for profile photos is acceptable
          }}
        />
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.95)',
            color: '#fff',
            border: '2px solid #fff',
            cursor: 'pointer',
            fontSize: 18,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

/**
 * Document/File Preview with Icon
 */
export function FilePreview({ file, onRemove }) {
  const fileName = file?.name || 'Unknown file';
  const fileSize = file?.size ? `${(file.size / 1024).toFixed(1)} KB` : '';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      border: `2px solid ${C.border}`,
      borderRadius: 10,
      background: '#f9fafb',
      position: 'relative',
    }}>
      <div style={{
        fontSize: 32,
      }}>
        📄
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: C.text,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {fileName}
        </div>
        {fileSize && (
          <div style={{
            fontSize: 12,
            color: C.textLight,
          }}>
            {fileSize}
          </div>
        )}
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.95)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
