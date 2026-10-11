import app from './app.json';
import auth from './auth.json';
import catalog from './catalog.json';
import categories from './categories.json';
import common from './common.json';
import errors from './errors.json';
import files from './files.json';
import home from './home.json';
import navigation from './navigation.json';
import pagination from './pagination.json';
import search from './search.json';
import seller from './seller.json';
import staging from './staging.json';

const dictionary = {
  ...app,
  ...auth,
  ...catalog,
  ...categories,
  ...common,
  ...errors,
  ...files,
  ...home,
  ...navigation,
  ...pagination,
  ...search,
  ...seller,
  ...staging,
};

export default dictionary;
